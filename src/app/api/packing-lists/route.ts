import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { convertFrontendToDbFormat } from '@/lib/packing-list-db';

// GET - ดึงรายการ Packing Lists ทั้งหมด
export async function GET(request: NextRequest) {
  try {
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

    const { data, error } = await supabase
      .from('packing_lists')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching packing lists:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/packing-lists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packing lists' },
      { status: 500 }
    );
  }
}

// POST - สร้าง Packing List ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = convertFrontendToDbFormat(body);

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

    const { data: inserted, error } = await supabase
      .from('packing_lists')
      .insert({
        consignee: data.consignee,
        consignee_address: data.consignee_address,
        consignee_phone: data.consignee_phone,
        consignee_email: data.consignee_email,
        consignee_contract: data.consignee_contract,
        consigner: data.consigner,
        consigner_address: data.consigner_address,
        consigner_phone: data.consigner_phone,
        consigner_email: data.consigner_email,
        consigner_contract: data.consigner_contract,
        shipped_to: data.shipped_to,
        shipped_to_address: data.shipped_to_address,
        shipped_to_phone: data.shipped_to_phone,
        shipped_to_email: data.shipped_to_email,
        shipped_to_contract: data.shipped_to_contract,
        customer_op_no: data.customer_op_no,
        type_of_shipment: data.type_of_shipment,
        port_loading: data.port_loading,
        port_destination: data.port_destination,
        total_gross_weight: data.total_gross_weight,
        box_size: data.box_size,
        shipping_mark: data.shipping_mark,
        airport: data.airport,
        destination: data.destination,
        country_of_origin: data.country_of_origin ?? 'Thailand',
        status: data.status ?? 'draft',
        notes: data.notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating packing list:', error);
      return NextResponse.json({ success: false, error: error.message, details: error.details, code: error.code }, { status: 400 });
    }

    // Insert pallets and products
    for (const pallet of data.pallets || []) {
      const { data: palletInserted, error: palletErr } = await supabase
        .from('packing_list_pallets')
        .insert({
          packing_list_id: inserted.id,
          pallet_number: pallet.pallet_number,
          box_number_from: pallet.box_number_from,
          box_number_to: pallet.box_number_to
        })
        .select()
        .single();

      if (palletErr) {
        console.error('Error creating pallet:', palletErr);
        return NextResponse.json({ success: false, error: palletErr.message }, { status: 400 });
      }

      for (const product of pallet.products || []) {
        const { error: prodErr } = await supabase
          .from('packing_list_products')
          .insert({
            pallet_id: palletInserted.id,
            product_code: product.product_code,
            description: product.description,
            batch: product.batch,
            quantity: product.quantity,
            weight_per_box: product.weight_per_box,
            total_gross_weight: product.total_gross_weight,
            has_mixed_products: product.has_mixed_products,
            second_product_code: product.second_product_code,
            second_description: product.second_description,
            second_batch: product.second_batch,
            second_weight_per_box: product.second_weight_per_box,
            second_total_gross_weight: product.second_total_gross_weight
          });

        if (prodErr) {
          console.error('Error creating product:', prodErr);
          return NextResponse.json({ success: false, error: prodErr.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({ success: true, data: inserted });
  } catch (error) {
    console.error('Error in POST /api/packing-lists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create packing list' },
      { status: 500 }
    );
  }
}

