const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const pallets = Array(7).fill().map(() => ({
  length: 83,
  width: 124,
  height: 152,
  weight: 100,
  quantity: 1
}));

// Calculate costs
const totalWeight = pallets.length * 100; // 7 * 100 = 700
const volumeWeight = pallets.length * (83 * 124 * 152) / 6000; // ~2538
const chargeableWeight = Math.max(totalWeight, volumeWeight);
const freightCost = chargeableWeight * 150;

console.log('Weight calculations:');
console.log('- Total weight:', totalWeight, 'kg');
console.log('- Volume weight:', volumeWeight.toFixed(1), 'kg');
console.log('- Chargeable weight:', chargeableWeight.toFixed(1), 'kg');
const clearanceCost = 5350;
const additionalCharges = [{ description: 'ค่ารถ', amount: 13000 }];
const additionalTotal = 13000;
const totalCost = freightCost + clearanceCost + additionalTotal;

const quotationData = {
  user_id: '044ddce6-cd5a-4adb-8dc4-0e9c4d028247',
  company_id: '25a00353-a2ef-46c2-b914-9e1480f5ff9f', // CIBID GROUP TH CO., LTD.
  customer_name: 'TBC',
  contact_person: '',
  destination_id: '60aa9c1c-c084-4988-ae3e-8ee3234d0a81', // Switzerlands (HIF)
  pallets: pallets,
  delivery_service_required: false,
  delivery_vehicle_type: '4wheel',
  additional_charges: additionalCharges,
  total_cost: totalCost,
  status: 'draft',
  // Optional fields
  company_name: 'Cibid Group',
  destination: 'Switzerlands (HIF)',
  contract_no: null,
  notes: null,
  total_freight_cost: freightCost,
  clearance_cost: clearanceCost,
  delivery_cost: 0,
  total_actual_weight: totalWeight,
  total_volume_weight: volumeWeight,
  chargeable_weight: chargeableWeight
};

console.log('Creating quotation with:');
console.log('- Pallets:', pallets.length);
console.log('- Freight cost:', freightCost);
console.log('- Clearance cost:', clearanceCost);
console.log('- Additional charges:', additionalTotal);
console.log('- Total cost:', totalCost);

supabase.from('quotations').insert(quotationData).then(result => {
  if (result.data) {
    console.log('SUCCESS! Created quotation ID:', result.data[0].id);
  } else {
    console.log('ERROR:', JSON.stringify(result.error, null, 2));
  }
}).catch(error => {
  console.log('CATCH ERROR:', error);
});
