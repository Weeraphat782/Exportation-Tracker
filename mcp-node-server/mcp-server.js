#!/usr/bin/env node

/**
 * Real MCP Server using MCP SDK for Cursor
 * Implements MCP protocol over stdio
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.error('Environment check:');
console.error('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
console.error('SUPABASE_KEY:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please check .env.local and .env files');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Global user email
let currentUserEmail = null;

// Helper function to get user ID from email
async function getUserIdFromEmail(email) {
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

class QuotationServer {
  constructor() {
    this.server = new Server(
      {
        name: 'exportation-quotation-manager',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'set_user_email',
            description: 'Set the user email for authentication. Call this first before using other tools.',
            inputSchema: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  description: 'The user email address'
                }
              },
              required: ['email']
            }
          },
          {
            name: 'list_companies',
            description: 'List all companies available in the system.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'list_destinations',
            description: 'List all destinations available in the system.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'list_quotations',
            description: 'List quotations for the current user.',
            inputSchema: {
              type: 'object',
              properties: {
                status_filter: {
                  type: 'string',
                  description: 'Optional status filter (draft, sent, completed, etc.)'
                }
              },
              required: []
            }
          },
          {
            name: 'create_quotation',
            description: 'Create a new quotation.',
            inputSchema: {
              type: 'object',
              properties: {
                company_name: { type: 'string', description: 'Company name' },
                customer_name: { type: 'string', description: 'Customer name' },
                destination: { type: 'string', description: 'Destination' },
                pallets: { type: 'string', description: 'JSON string of pallets array' },
                contact_person: { type: 'string', description: 'Contact person' },
                contract_no: { type: 'string', description: 'Contract number' },
                notes: { type: 'string', description: 'Notes' }
              },
              required: ['company_name', 'customer_name', 'destination', 'pallets']
            }
          },
          {
            name: 'get_total_amount_by_company',
            description: 'Get total amount from all quotations for a specific company.',
            inputSchema: {
              type: 'object',
              properties: {
                company_name: {
                  type: 'string',
                  description: 'Name of the company (partial matching supported)'
                }
              },
              required: ['company_name']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'set_user_email':
            return await this.handleSetUserEmail(args.email);

          case 'list_companies':
            return await this.handleListCompanies();

          case 'list_destinations':
            return await this.handleListDestinations();

          case 'list_quotations':
            return await this.handleListQuotations(args.status_filter);

          case 'create_quotation':
            return await this.handleCreateQuotation(args);

          case 'get_total_amount_by_company':
            return await this.handleGetTotalAmountByCompany(args.company_name);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  async handleSetUserEmail(email) {
    currentUserEmail = email;
    const userId = await getUserIdFromEmail(email);

    if (userId) {
      return {
        content: [{ type: 'text', text: `Authentication successful. Using email: ${email} (User ID: ${userId})` }]
      };
    } else {
      return {
        content: [{ type: 'text', text: `Email set to: ${email}, but user not found in database. Some operations may not work.` }]
      };
    }
  }

  async handleListCompanies() {
    if (!currentUserEmail) {
      return {
        content: [{ type: 'text', text: 'Please set user email first using set_user_email tool' }],
        isError: true
      };
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return {
        content: [{ type: 'text', text: 'Error: User not found' }],
        isError: true
      };
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }

    if (!data || data.length === 0) {
      return {
        content: [{ type: 'text', text: 'No companies found. Create a company first.' }]
      };
    }

    const companies = data.map(company => `• ${company.name} (ID: ${company.id})`);
    return {
      content: [{ type: 'text', text: `Available Companies:\n${companies.join('\n')}` }]
    };
  }

  async handleListDestinations() {
    if (!currentUserEmail) {
      return {
        content: [{ type: 'text', text: 'Please set user email first using set_user_email tool' }],
        isError: true
      };
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return {
        content: [{ type: 'text', text: 'Error: User not found' }],
        isError: true
      };
    }

    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }

    if (!data || data.length === 0) {
      return {
        content: [{ type: 'text', text: 'No destinations found. Create a destination first.' }]
      };
    }

    const destinations = data.map(dest => `• ${dest.country} - ${dest.port || 'N/A'} (ID: ${dest.id})`);
    return {
      content: [{ type: 'text', text: `Available Destinations:\n${destinations.join('\n')}` }]
    };
  }

  async handleListQuotations(statusFilter) {
    if (!currentUserEmail) {
      return {
        content: [{ type: 'text', text: 'Please set user email first using set_user_email tool' }],
        isError: true
      };
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return {
        content: [{ type: 'text', text: 'Error: User not found' }],
        isError: true
      };
    }

    let query = supabase
      .from('quotations')
      .select('*')
      .eq('user_id', userId);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }

    if (!data || data.length === 0) {
      const filterMsg = statusFilter ? ` with status '${statusFilter}'` : '';
      return {
        content: [{ type: 'text', text: `No quotations found${filterMsg}.` }]
      };
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

    return {
      content: [{ type: 'text', text: result }]
    };
  }

  async handleCreateQuotation(args) {
    const { company_name, customer_name, destination, pallets, contact_person, contract_no, notes } = args;

    if (!currentUserEmail) {
      return {
        content: [{ type: 'text', text: 'Please set user email first using set_user_email tool' }],
        isError: true
      };
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return {
        content: [{ type: 'text', text: 'Error: User not found' }],
        isError: true
      };
    }

    // Parse pallets JSON
    let palletsData;
    try {
      palletsData = JSON.parse(pallets);
      if (!Array.isArray(palletsData) || palletsData.length === 0) {
        return {
          content: [{ type: 'text', text: 'Error: Pallets must be a non-empty JSON array' }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: 'Error: Invalid pallets JSON format' }],
        isError: true
      };
    }

    // Find company and destination
    const { data: companies } = await supabase
      .from('companies')
      .select('id', 'name')
      .eq('user_id', userId);

    const { data: destinations } = await supabase
      .from('destinations')
      .select('id', 'country')
      .eq('user_id', userId);

    if (!companies || companies.length === 0) {
      return {
        content: [{ type: 'text', text: 'Error: No companies found for this user' }],
        isError: true
      };
    }

    if (!destinations || destinations.length === 0) {
      return {
        content: [{ type: 'text', text: 'Error: No destinations found for this user' }],
        isError: true
      };
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
      const available = companies.map(c => c.name).join(', ');
      return {
        content: [{ type: 'text', text: `Error: Company '${company_name}' not found. Available: ${available}` }],
        isError: true
      };
    }

    if (!destinationId) {
      const available = destinations.map(d => d.country).join(', ');
      return {
        content: [{ type: 'text', text: `Error: Destination '${destination}' not found. Available: ${available}` }],
        isError: true
      };
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
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Success: Quotation created successfully!\nID: ${data.id}\nTotal Cost: ${freightCost.toLocaleString()} THB\nStatus: draft`
      }]
    };
  }

  async handleGetTotalAmountByCompany(companyName) {
    if (!currentUserEmail) {
      return {
        content: [{ type: 'text', text: 'Please set user email first using set_user_email tool' }],
        isError: true
      };
    }

    const userId = await getUserIdFromEmail(currentUserEmail);
    if (!userId) {
      return {
        content: [{ type: 'text', text: 'Error: User not found' }],
        isError: true
      };
    }

    const { data: quotations, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }

    // Find company (partial matching)
    let targetCompany = null;
    for (const quote of quotations) {
      const compName = quote.company_name || '';
      if (companyName.toLowerCase().includes(compName.toLowerCase()) ||
          compName.toLowerCase().includes(companyName.toLowerCase())) {
        targetCompany = compName;
        break;
      }
    }

    if (!targetCompany) {
      return {
        content: [{ type: 'text', text: `Error: Company '${companyName}' not found in quotations` }],
        isError: true
      };
    }

    // Calculate total
    const companyQuotations = quotations.filter(q => q.company_name === targetCompany);
    const totalAmount = companyQuotations.reduce((sum, q) => sum + (q.total_cost || 0), 0);
    const quotationCount = companyQuotations.length;

    return {
      content: [{
        type: 'text',
        text: `Total amount for ${targetCompany}: ${totalAmount.toLocaleString()} THB from ${quotationCount} quotations`
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Quotation MCP server running...');
  }
}

// Start the server
const server = new QuotationServer();
server.run().catch(console.error);
