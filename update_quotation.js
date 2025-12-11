const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const quotationId = 'dcb5e22c-0393-401f-b2ee-0209df42cd46';

// Update quotation with clearance cost and additional charges
const updateData = {
  clearance_cost: 5350,
  additional_charges: [{ description: 'ค่ารถ', amount: 13000 }],
  total_cost: 273767 + 5350 + 13000 // freight + clearance + additional
};

console.log('Updating quotation with clearance cost and additional charges...');
console.log('New total cost:', updateData.total_cost);

supabase.from('quotations').update(updateData).eq('id', quotationId).then(result => {
  if (result.data) {
    console.log('SUCCESS! Updated quotation');
  } else {
    console.log('ERROR:', JSON.stringify(result.error, null, 2));
  }
}).catch(error => {
  console.log('CATCH ERROR:', error);
});

