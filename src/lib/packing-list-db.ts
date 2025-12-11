import { supabase } from './supabase';

// Types สำหรับ Packing List
export interface PackingList {
  id: string;
  packing_list_no: string;
  consignee: string;
  consignee_address?: string;
  consignee_phone?: string;
  consignee_email?: string;
  consignee_contract?: string;
  consigner: string;
  consigner_address?: string;
  consigner_phone?: string;
  consigner_email?: string;
  consigner_contract?: string;
  shipped_to?: string;
  shipped_to_address?: string;
  shipped_to_phone?: string;
  shipped_to_email?: string;
  shipped_to_contract?: string;
  customer_op_no?: string;
  type_of_shipment?: string;
  port_loading?: string;
  port_destination?: string;
  total_gross_weight?: number;
  box_size?: string;
  shipping_mark?: string;
  airport?: string;
  destination?: string;
  country_of_origin?: string;
  status: 'draft' | 'completed' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PackingListPallet {
  id: string;
  packing_list_id: string;
  pallet_number: number;
  box_number_from: number;
  box_number_to: number;
  created_at: string;
}

export interface PackingListProduct {
  id: string;
  pallet_id: string;
  product_code?: string;
  description?: string;
  batch?: string;
  quantity: number;
  weight_per_box: number;
  total_gross_weight: number;
  has_mixed_products: boolean;
  second_product_code?: string;
  second_description?: string;
  second_batch?: string;
  second_weight_per_box?: number;
  second_total_gross_weight?: number;
  created_at: string;
}

// Type สำหรับสร้าง Packing List ใหม่
export interface NewPackingListData {
  consignee: string;
  consignee_address?: string;
  consignee_phone?: string;
  consignee_email?: string;
  consignee_contract?: string;
  consigner: string;
  consigner_address?: string;
  consigner_phone?: string;
  consigner_email?: string;
  consigner_contract?: string;
  shipped_to?: string;
  shipped_to_address?: string;
  shipped_to_phone?: string;
  shipped_to_email?: string;
  shipped_to_contract?: string;
  customer_op_no?: string;
  type_of_shipment?: string;
  port_loading?: string;
  port_destination?: string;
  total_gross_weight?: number;
  box_size?: string;
  shipping_mark?: string;
  airport?: string;
  destination?: string;
  country_of_origin?: string;
  status?: 'draft' | 'completed' | 'archived';
  notes?: string;
  pallets: Array<{
    pallet_number: number;
    box_number_from: number;
    box_number_to: number;
    products: Array<{
      product_code?: string;
      description?: string;
      batch?: string;
      quantity: number;
      weight_per_box: number;
      total_gross_weight: number;
      has_mixed_products: boolean;
      second_product_code?: string;
      second_description?: string;
      second_batch?: string;
      second_weight_per_box?: number;
      second_total_gross_weight?: number;
    }>;
  }>;
}

// ดึงรายการ Packing List ทั้งหมดของ user
export async function getPackingLists(): Promise<PackingList[]> {
  try {
    const { data, error } = await supabase
      .from('packing_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching packing lists:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPackingLists:', error);
    return [];
  }
}

// ดึงข้อมูล Packing List พร้อมกับ Pallets และ Products
export async function getPackingListWithDetails(id: string): Promise<{
  packingList: PackingList | null;
  pallets: (PackingListPallet & { products: PackingListProduct[] })[];
}> {
  try {
    // ดึงข้อมูล Packing List หลัก
    const { data: packingList, error: packingListError } = await supabase
      .from('packing_lists')
      .select('*')
      .eq('id', id)
      .single();

    if (packingListError) {
      console.error('Error fetching packing list:', packingListError);
      return { packingList: null, pallets: [] };
    }

    // ดึงข้อมูล Pallets
    const { data: pallets, error: palletsError } = await supabase
      .from('packing_list_pallets')
      .select('*')
      .eq('packing_list_id', id)
      .order('pallet_number');

    if (palletsError) {
      console.error('Error fetching pallets:', palletsError);
      return { packingList, pallets: [] };
    }

    // ดึงข้อมูล Products สำหรับแต่ละ Pallet
    const palletsWithProducts = await Promise.all(
      (pallets || []).map(async (pallet) => {
        const { data: products, error: productsError } = await supabase
          .from('packing_list_products')
          .select('*')
          .eq('pallet_id', pallet.id);

        if (productsError) {
          console.error('Error fetching products:', productsError);
          return { ...pallet, products: [] };
        }

        return { ...pallet, products: products || [] };
      })
    );

    return {
      packingList,
      pallets: palletsWithProducts
    };
  } catch (error) {
    console.error('Error in getPackingListWithDetails:', error);
    return { packingList: null, pallets: [] };
  }
}

// สร้าง Packing List ใหม่
export async function createPackingList(data: NewPackingListData): Promise<PackingList | null> {
  try {
    // ใช้ NULL สำหรับ created_by เมื่อไม่มีการ authentication
    const createdBy = null;

    // สร้าง Packing List หลัก
    const { data: packingList, error: packingListError } = await supabase
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
        country_of_origin: data.country_of_origin || 'Thailand',
        status: data.status || 'draft',
        notes: data.notes,
        created_by: createdBy
      })
      .select()
      .single();

    if (packingListError) {
      console.error('Error creating packing list:', packingListError);
      return null;
    }

    // สร้าง Pallets และ Products
    for (const palletData of data.pallets) {
      const { data: pallet, error: palletError } = await supabase
        .from('packing_list_pallets')
        .insert({
          packing_list_id: packingList.id,
          pallet_number: palletData.pallet_number,
          box_number_from: palletData.box_number_from,
          box_number_to: palletData.box_number_to
        })
        .select()
        .single();

      if (palletError) {
        console.error('Error creating pallet:', palletError);
        continue;
      }

      // สร้าง Products ในแต่ละ Pallet
      for (const productData of palletData.products) {
        const { error: productError } = await supabase
          .from('packing_list_products')
          .insert({
            pallet_id: pallet.id,
            product_code: productData.product_code,
            description: productData.description,
            batch: productData.batch,
            quantity: productData.quantity,
            weight_per_box: productData.weight_per_box,
            total_gross_weight: productData.total_gross_weight,
            has_mixed_products: productData.has_mixed_products,
            second_product_code: productData.second_product_code,
            second_description: productData.second_description,
            second_batch: productData.second_batch,
            second_weight_per_box: productData.second_weight_per_box,
            second_total_gross_weight: productData.second_total_gross_weight
          });

        if (productError) {
          console.error('Error creating product:', productError);
        }
      }
    }

    return packingList;
  } catch (error) {
    console.error('Error in createPackingList:', error);
    return null;
  }
}

// อัพเดต Packing List
export async function updatePackingList(
  id: string, 
  updates: Partial<Omit<PackingList, 'id' | 'created_at' | 'created_by' | 'packing_list_no'>>
): Promise<PackingList | null> {
  try {
    const { data, error } = await supabase
      .from('packing_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating packing list:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updatePackingList:', error);
    return null;
  }
}

// ลบ Packing List
export async function deletePackingList(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('packing_lists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting packing list:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePackingList:', error);
    return false;
  }
}

// แปลงข้อมูลจาก Database format เป็น Frontend format
export function convertDbToFrontendFormat(
  packingList: PackingList,
  pallets: (PackingListPallet & { products: PackingListProduct[] })[]
) {
  return {
    id: packingList.id,
    packing_list_no: packingList.packing_list_no,
    consignee: packingList.consignee,
    consigneeAddress: packingList.consignee_address || '',
    consigneePhone: packingList.consignee_phone || '',
    consigneeEmail: packingList.consignee_email || '',
    consigneeContract: packingList.consignee_contract || '',
    consigner: packingList.consigner,
    consignerAddress: packingList.consigner_address || '',
    consignerPhone: packingList.consigner_phone || '',
    consignerEmail: packingList.consigner_email || '',
    consignerContract: packingList.consigner_contract || '',
    shippedTo: packingList.shipped_to || '',
    shippedToAddress: packingList.shipped_to_address || '',
    shippedToPhone: packingList.shipped_to_phone || '',
    shippedToEmail: packingList.shipped_to_email || '',
    shippedToContract: packingList.shipped_to_contract || '',
    customerOpNo: packingList.customer_op_no || '',
    typeOfShipment: packingList.type_of_shipment || '',
    portLoading: packingList.port_loading || '',
    portDestination: packingList.port_destination || '',
    totalGrossWeight: packingList.total_gross_weight || 0,
    boxSize: packingList.box_size || '',
    shippingMark: packingList.shipping_mark || '',
    airport: packingList.airport || '',
    destination: packingList.destination || '',
    countryOfOrigin: packingList.country_of_origin || 'Thailand',
    status: packingList.status,
    notes: packingList.notes || '',
    pallets: pallets.map((pallet, index) => ({
      id: (index + 1).toString(),
      boxNumberFrom: pallet.box_number_from,
      boxNumberTo: pallet.box_number_to,
      products: pallet.products.map((product, productIndex) => ({
        id: (productIndex + 1).toString(),
        productCode: product.product_code || '',
        description: product.description || '',
        batch: product.batch || '',
        quantity: product.quantity,
        weightPerBox: product.weight_per_box,
        totalGrossWeight: product.total_gross_weight,
        hasMixedProducts: product.has_mixed_products,
        secondProduct: product.has_mixed_products ? {
          productCode: product.second_product_code || '',
          description: product.second_description || '',
          batch: product.second_batch || '',
          weightPerBox: product.second_weight_per_box || 0,
          totalGrossWeight: product.second_total_gross_weight || 0
        } : undefined
      }))
    })),
    created_at: packingList.created_at,
    updated_at: packingList.updated_at
  };
}

// แปลงข้อมูลจาก Frontend format เป็น Database format
export function convertFrontendToDbFormat(frontendData: {
  consignee: string;
  consigneeAddress?: string;
  consigneePhone?: string;
  consigneeEmail?: string;
  consigneeContract?: string;
  consigner: string;
  consignerAddress?: string;
  consignerPhone?: string;
  consignerEmail?: string;
  consignerContract?: string;
  shippedTo?: string;
  shippedToAddress?: string;
  shippedToPhone?: string;
  shippedToEmail?: string;
  shippedToContract?: string;
  customerOpNo?: string;
  typeOfShipment?: string;
  portLoading?: string;
  portDestination?: string;
  totalGrossWeight?: number;
  boxSize?: string;
  shippingMark?: string;
  airport?: string;
  destination?: string;
  countryOfOrigin?: string;
  status?: 'draft' | 'completed' | 'archived';
  notes?: string;
  pallets: Array<{
    boxNumberFrom: number;
    boxNumberTo: number;
    products: Array<{
      productCode?: string;
      description?: string;
      batch?: string;
      quantity: number;
      weightPerBox: number;
      totalGrossWeight: number;
      hasMixedProducts: boolean;
      secondProduct?: {
        productCode?: string;
        description?: string;
        batch?: string;
        weightPerBox?: number;
        totalGrossWeight?: number;
      };
    }>
  }>;
}): NewPackingListData {
  return {
    consignee: frontendData.consignee,
    consignee_address: frontendData.consigneeAddress,
    consignee_phone: frontendData.consigneePhone,
    consignee_email: frontendData.consigneeEmail,
    consignee_contract: frontendData.consigneeContract,
    consigner: frontendData.consigner,
    consigner_address: frontendData.consignerAddress,
    consigner_phone: frontendData.consignerPhone,
    consigner_email: frontendData.consignerEmail,
    consigner_contract: frontendData.consignerContract,
    shipped_to: frontendData.shippedTo,
    shipped_to_address: frontendData.shippedToAddress,
    shipped_to_phone: frontendData.shippedToPhone,
    shipped_to_email: frontendData.shippedToEmail,
    shipped_to_contract: frontendData.shippedToContract,
    customer_op_no: frontendData.customerOpNo,
    type_of_shipment: frontendData.typeOfShipment,
    port_loading: frontendData.portLoading,
    port_destination: frontendData.portDestination,
    total_gross_weight: frontendData.totalGrossWeight,
    box_size: frontendData.boxSize,
    shipping_mark: frontendData.shippingMark,
    airport: frontendData.airport,
    destination: frontendData.destination,
    country_of_origin: frontendData.countryOfOrigin,
    status: frontendData.status || 'draft',
    notes: frontendData.notes,
    pallets: frontendData.pallets.map((pallet, index: number) => ({
      pallet_number: index + 1,
      box_number_from: pallet.boxNumberFrom,
      box_number_to: pallet.boxNumberTo,
      products: pallet.products.map((product) => ({
        product_code: product.productCode,
        description: product.description,
        batch: product.batch,
        quantity: product.quantity,
        weight_per_box: product.weightPerBox,
        total_gross_weight: product.totalGrossWeight,
        has_mixed_products: product.hasMixedProducts,
        second_product_code: product.secondProduct?.productCode,
        second_description: product.secondProduct?.description,
        second_batch: product.secondProduct?.batch,
        second_weight_per_box: product.secondProduct?.weightPerBox,
        second_total_gross_weight: product.secondProduct?.totalGrossWeight
      }))
    }))
  };
}
