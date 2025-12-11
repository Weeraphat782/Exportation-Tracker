const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Minimal quotation data
const quotationData = {
  user_id: '044ddce6-cd5a-4adb-8dc4-0e9c4d028247',
  company_id: '25a00353-a2ef-46c2-b914-9e1480f5ff9f',
  customer_name: 'TBC',
  contact_person: '',
  destination_id: '60aa9c1c-c084-4988-ae3e-8ee3234d0a81',
  pallets: [{ length: 83, width: 124, height: 152, weight: 100, quantity: 1 }],
  delivery_service_required: false,
  delivery_vehicle_type: '4wheel',
  additional_charges: [],
  total_cost: 1000,
  status: 'draft'
};

console.log('Creating minimal quotation...');

supabase.from('quotations').insert(quotationData).then(result => {
  if (result.data) {
    console.log('SUCCESS! Created quotation ID:', result.data[0].id);
  } else {
    console.log('ERROR:', JSON.stringify(result.error, null, 2));
  }
}).catch(error => {
  console.log('CATCH ERROR:', error);
});

