import { NextRequest, NextResponse } from 'next/server';
import { 
  convertDbToFrontendFormat,
  PackingListPallet,
  PackingListProduct
} from '@/lib/packing-list-db';
import { createClient } from '@supabase/supabase-js';

// GET - ดึงข้อมูล Packing List พร้อมรายละเอียดทั้งหมด
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params สำหรับ Next.js 15
    const { id } = await params;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Fetch packing list
    const { data: packingList, error: plErr } = await supabase
      .from('packing_lists')
      .select('*')
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (plErr || !packingList) {
      return NextResponse.json(
        { success: false, error: 'Packing list not found' },
        { status: 404 }
      );
    }

    // Fetch pallets
    const { data: palletsRaw, error: palletsErr } = await supabase
      .from('packing_list_pallets')
      .select('*')
      .eq('packing_list_id', id)
      .order('pallet_number');

    if (palletsErr) {
      return NextResponse.json(
        { success: false, error: palletsErr.message },
        { status: 400 }
      );
    }

    // Fetch products per pallet
    const pallets = await Promise.all((palletsRaw as PackingListPallet[] | null || []).map(async (p: PackingListPallet) => {
      const { data: products, error: productsErr } = await supabase
        .from('packing_list_products')
        .select('*')
        .eq('pallet_id', p.id);
      if (productsErr) {
        return { ...p, products: [] as PackingListProduct[] } as PackingListPallet & { products: PackingListProduct[] };
      }
      return { ...p, products: (products as PackingListProduct[] | null) || [] } as PackingListPallet & { products: PackingListProduct[] };
    }));
    
    if (!packingList) {
      return NextResponse.json(
        { success: false, error: 'Packing list not found' },
        { status: 404 }
      );
    }
    
    // แปลงข้อมูลเป็น format ที่ frontend ใช้
    const frontendData = convertDbToFrontendFormat(packingList, pallets);
    
    return NextResponse.json({ success: true, data: frontendData });
  } catch (error) {
    console.error('Error in GET /api/packing-lists/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packing list' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดต Packing List
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // อัพเดตเฉพาะข้อมูลหลัก (ไม่รวม pallets/products ซึ่งต้องจัดการแยก)
    const updates = {
      consignee: body.consignee,
      consignee_address: body.consigneeAddress,
      consignee_phone: body.consigneePhone,
      consignee_email: body.consigneeEmail,
      consignee_contract: body.consigneeContract,
      consigner: body.consigner,
      consigner_address: body.consignerAddress,
      consigner_phone: body.consignerPhone,
      consigner_email: body.consignerEmail,
      consigner_contract: body.consignerContract,
      shipped_to: body.shippedTo,
      shipped_to_address: body.shippedToAddress,
      shipped_to_phone: body.shippedToPhone,
      shipped_to_email: body.shippedToEmail,
      shipped_to_contract: body.shippedToContract,
      customer_op_no: body.customerOpNo,
      type_of_shipment: body.typeOfShipment,
      port_loading: body.portLoading,
      port_destination: body.portDestination,
      total_gross_weight: body.totalGrossWeight,
      box_size: body.boxSize,
      shipping_mark: body.shippingMark,
      airport: body.airport,
      destination: body.destination,
      country_of_origin: body.countryOfOrigin,
      status: body.status,
      notes: body.notes
    };
    
    const { data: updated, error } = await supabase
      .from('packing_lists')
      .update(updates)
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PUT /api/packing-lists/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update packing list' },
      { status: 500 }
    );
  }
}

// DELETE - ลบ Packing List
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { error } = await supabase
      .from('packing_lists')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Packing list deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/packing-lists/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete packing list' },
      { status: 500 }
    );
  }
}
