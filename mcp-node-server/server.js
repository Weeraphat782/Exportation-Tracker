#!/usr/bin/env node

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '../.env' });

const app = express();
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Global user email (set via API)
let currentUserEmail = null;

// Helper function to get user ID from email
async function getUserIdFromEmail(email) {
  // For testing with known user ID
  if (email === "vieww.weeraphat@gmail.com") {
    return "044ddce6-cd5a-4adb-8dc4-0e9c4d028247";
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

// MCP Tools as HTTP endpoints

// Set user email
app.post('/tools/set_user_email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    currentUserEmail = email;
    const userId = await getUserIdFromEmail(email);

    if (userId) {
      res.json({
        result: `Authentication successful. Using email: ${email} (User ID: ${userId})`
      });
    } else {
      res.json({
        result: `Email set to: ${email}, but user not found in database. Some operations may not work.`
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List companies
app.post('/tools/list_companies', async (req, res) => {
  try {
    if (!currentUserEmail) {
      return res.status(400).json({ error: 'Please set user email first using set_user_email tool' });
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return res.status(400).json({ error: 'User not found' });
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.json({ result: 'No companies found. Create a company first.' });
    }

    const companies = data.map(company => `• ${company.name} (ID: ${company.id})`);
    res.json({
      result: `Available Companies:\n${companies.join('\n')}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List destinations
app.post('/tools/list_destinations', async (req, res) => {
  try {
    if (!currentUserEmail) {
      return res.status(400).json({ error: 'Please set user email first using set_user_email tool' });
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return res.status(400).json({ error: 'User not found' });
    }

    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.json({ result: 'No destinations found. Create a destination first.' });
    }

    const destinations = data.map(dest => `• ${dest.country} - ${dest.port || 'N/A'} (ID: ${dest.id})`);
    res.json({
      result: `Available Destinations:\n${destinations.join('\n')}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List quotations
app.post('/tools/list_quotations', async (req, res) => {
  try {
    const { status_filter } = req.body;

    if (!currentUserEmail) {
      return res.status(400).json({ error: 'Please set user email first using set_user_email tool' });
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return res.status(400).json({ error: 'User not found' });
    }

    let query = supabase
      .from('quotations')
      .select('*')
      .eq('user_id', userId);

    if (status_filter) {
      query = query.eq('status', status_filter);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      const filterMsg = status_filter ? ` with status '${status_filter}'` : '';
      return res.json({ result: `No quotations found${filterMsg}.` });
    }

    const quotations = data.slice(0, 10).map(quote => {
      const status = quote.status || 'unknown';
      const company = quote.company_name || 'N/A';
      const destination = quote.destination || 'N/A';
      const cost = quote.total_cost || 0;
      return `• [${status.toUpperCase()}] ${company} → ${destination} (${cost.toLocaleString()} THB)`;
    });

    const result = `Quotations (${data.length} total):\n${quotations.join('\n')}`;
    if (data.length > 10) {
      result += `\n... and ${data.length - 10} more`;
    }

    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create quotation
app.post('/tools/create_quotation', async (req, res) => {
  try {
    const { company_name, customer_name, destination, pallets, contact_person, contract_no, notes } = req.body;

    if (!company_name || !customer_name || !destination || !pallets) {
      return res.status(400).json({ error: 'Missing required fields: company_name, customer_name, destination, pallets' });
    }

    if (!currentUserEmail) {
      return res.status(400).json({ error: 'Please set user email first using set_user_email tool' });
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Parse pallets JSON
    let palletsData;
    try {
      palletsData = JSON.parse(pallets);
      if (!Array.isArray(palletsData) || palletsData.length === 0) {
        return res.status(400).json({ error: 'Pallets must be a non-empty JSON array' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid pallets JSON format' });
    }

    // Find company and destination
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id', 'name')
      .eq('user_id', userId);

    if (compError) {
      return res.status(500).json({ error: `Companies query error: ${compError.message}` });
    }

    const { data: destinations, error: destError } = await supabase
      .from('destinations')
      .select('id', 'country')
      .eq('user_id', userId);

    if (destError) {
      return res.status(500).json({ error: `Destinations query error: ${destError.message}` });
    }

    if (!companies || companies.length === 0) {
      return res.status(400).json({ error: 'No companies found for this user' });
    }

    if (!destinations || destinations.length === 0) {
      return res.status(400).json({ error: 'No destinations found for this user' });
    }

    let companyId = null;
    let destinationId = null;

    // Find company (partial matching)
    for (const comp of companies) {
      const compName = comp.name || '';
      const searchName = company_name || '';
      if (searchName.toLowerCase().includes(compName.toLowerCase()) ||
          compName.toLowerCase().includes(searchName.toLowerCase())) {
        companyId = comp.id;
        break;
      }
    }

    // Find destination (partial matching)
    for (const dest of destinations) {
      const destCountry = dest.country || '';
      const searchDest = destination || '';
      if (searchDest.toLowerCase().includes(destCountry.toLowerCase()) ||
          destCountry.toLowerCase().includes(searchDest.toLowerCase())) {
        destinationId = dest.id;
        break;
      }
    }

    if (!companyId) {
      return res.status(400).json({
        error: `Company '${company_name}' not found. Available: ${companies.map(c => c.name).join(', ')}`
      });
    }

    if (!destinationId) {
      return res.status(400).json({
        error: `Destination '${destination}' not found. Available: ${destinations.map(d => d.country).join(', ')}`
      });
    }

    // Calculate costs
    const totalWeight = palletsData.reduce((sum, pallet) =>
      sum + (pallet.weight || 0) * (pallet.quantity || 1), 0);
    const volumeWeight = palletsData.reduce((sum, pallet) => {
      const length = pallet.length || 0;
      const width = pallet.width || 0;
      const height = pallet.height || 0;
      const quantity = pallet.quantity || 1;
      return sum + ((length * width * height * quantity) / 6000);
    }, 0);
    const chargeableWeight = Math.max(totalWeight, Math.ceil(volumeWeight));
    const freightCost = chargeableWeight * 150;

    const quotationData = {
      user_id: userId,
      company_id: companyId,
      company_name: companies.find(c => c.id === companyId).name,
      customer_name: customer_name,
      destination_id: destinationId,
      destination: destinations.find(d => d.id === destinationId).country,
      contact_person: contact_person || '',
      contract_no: contract_no || null,
      pallets: palletsData,
      delivery_service_required: false,
      delivery_vehicle_type: '4wheel',
      additional_charges: [],
      notes: notes || null,
      total_freight_cost: freightCost,
      delivery_cost: 0,
      clearance_cost: 0,
      total_cost: freightCost,
      total_volume_weight: volumeWeight,
      total_actual_weight: totalWeight,
      chargeable_weight: chargeableWeight,
      status: 'draft'
    };

    const { data, error } = await supabase
      .from('quotations')
      .insert(quotationData)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      result: `Success: Quotation created successfully!\nID: ${data.id}\nTotal Cost: ${freightCost.toLocaleString()} THB\nStatus: draft`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total amount by company
app.post('/tools/get_total_amount_by_company', async (req, res) => {
  try {
    const { company_name } = req.body;

    if (!currentUserEmail) {
      return res.status(400).json({ error: 'Please set user email first using set_user_email tool' });
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return res.status(400).json({ error: 'User not found' });
    }

    const { data: quotations, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Find company (partial matching)
    let targetCompany = null;
    for (const quote of quotations) {
      const compName = quote.company_name || '';
      if (company_name.toLowerCase().includes(compName.toLowerCase()) ||
          compName.toLowerCase().includes(company_name.toLowerCase())) {
        targetCompany = compName;
        break;
      }
    }

    if (!targetCompany) {
      return res.status(400).json({
        error: `Company '${company_name}' not found in quotations`
      });
    }

    // Calculate total
    const companyQuotations = quotations.filter(q => q.company_name === targetCompany);
    const totalAmount = companyQuotations.reduce((sum, q) => sum + (q.total_cost || 0), 0);
    const quotationCount = companyQuotations.length;

    res.json({
      result: `Total amount for ${targetCompany}: ${totalAmount.toLocaleString()} THB from ${quotationCount} quotations`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'MCP Node.js Server is running' });
});

// List available tools
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      'set_user_email',
      'list_companies',
      'list_destinations',
      'list_quotations',
      'create_quotation',
      'get_total_amount_by_company'
    ]
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`MCP Node.js Server running on port ${PORT}`);
  console.log('Available tools:');
  console.log('- POST /tools/set_user_email');
  console.log('- POST /tools/list_companies');
  console.log('- POST /tools/list_destinations');
  console.log('- POST /tools/list_quotations');
  console.log('- POST /tools/create_quotation');
  console.log('- POST /tools/get_total_amount_by_company');
  console.log('- GET /health');
  console.log('- GET /tools');
});
