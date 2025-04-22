import { supabase } from '@/lib/supabase';

// Type definitions for our database tables
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  position?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface Destination {
  id: string;
  country: string;
  port?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface FreightRate {
  id: string;
  destination_id: string;
  min_weight?: number | null;
  max_weight?: number | null;
  base_rate: number;
  effective_date?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

// Define specific types for complex array fields
interface Pallet {
  length: number | string;
  width: number | string;
  height: number | string;
  weight: number | string;
  quantity: number | string;
}

interface AdditionalCharge {
  name: string;
  description: string;
  amount: number;
}

export interface Quotation {
  id: string;
  created_at: string;
  user_id: string;
  company_id: string;
  contact_person: string;
  contract_no?: string | null;
  destination_id: string;
  pallets: Pallet[]; // Use specific type
  delivery_service_required: boolean;
  delivery_vehicle_type: '4wheel' | '6wheel';
  additional_charges: AdditionalCharge[]; // Use specific type
  notes?: string | null;
  total_cost: number;
  status: 'draft' | 'sent';
  company_name?: string | null;
  destination?: string | null;
  updated_at?: string;
  
  // Additional cost breakdown fields
  total_freight_cost?: number;
  clearance_cost?: number; 
  delivery_cost?: number;
  
  // Weight calculation fields
  total_actual_weight?: number;
  total_volume_weight?: number;
  chargeable_weight?: number;
}

export interface DocumentSubmission {
  id: string;
  quotation_id: string;
  company_name: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  status?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Setting {
  id: string;
  category: string;
  settings_key: string;
  settings_value?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

// PROFILE FUNCTIONS
export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return null;
  }
}

// COMPANY FUNCTIONS
export async function getCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching companies:', error);
      return null;
    }

    return data as Company[];
  } catch (error) {
    console.error('Error in getCompanies:', error);
    return null;
  }
}

export async function getCompanyById(id: string) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      return null;
    }

    return data as Company;
  } catch (error) {
    console.error('Error in getCompanyById:', error);
    return null;
  }
}

export async function createCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert([company])
      .select();

    if (error) {
      console.error('Error creating company:', error);
      return null;
    }

    return data[0] as Company;
  } catch (error) {
    console.error('Error in createCompany:', error);
    return null;
  }
}

export async function updateCompany(id: string, updates: Partial<Company>) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating company:', error);
      return null;
    }

    return data[0] as Company;
  } catch (error) {
    console.error('Error in updateCompany:', error);
    return null;
  }
}

export async function deleteCompany(id: string) {
  try {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting company:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCompany:', error);
    return false;
  }
}

// DESTINATION FUNCTIONS
export async function getDestinations() {
  try {
    const { data, error } = await supabase
      .from('destinations')
      .select('id, country, port')
      .order('country', { ascending: true });

    if (error) {
      console.error('Error fetching destinations:', error);
      return [];
    }

    return data as Pick<Destination, 'id' | 'country' | 'port'>[];
  } catch (error) {
    console.error('Error in getDestinations:', error);
    return [];
  }
}

export async function getDestinationById(id: string) {
  try {
    const { data, error } = await supabase
      .from('destinations')
      .select('id, country, port')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching destination:', error);
      return null;
    }

    return data as Pick<Destination, 'id' | 'country' | 'port'>;
  } catch (error) {
    console.error('Error in getDestinationById:', error);
    return null;
  }
}

export async function createDestination(destination: Omit<Destination, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("User not authenticated to create destination.");
    }

    const dataToSave = {
      country: destination.country,
      port: destination.port || null,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('destinations')
      .insert([dataToSave])
      .select('id, country, port');

    if (error) {
      console.error('Error creating destination:', error);
      return null;
    }

    return data[0] as Destination;
  } catch (error) {
    console.error('Error in createDestination:', error);
    return null;
  }
}

export async function updateDestination(id: string, updates: Partial<Pick<Destination, 'country' | 'port'>>) {
  try {
    const { data, error } = await supabase
      .from('destinations')
      .update(updates)
      .eq('id', id)
      .select('id, country, port');

    if (error) {
      console.error('Error updating destination:', error);
      return null;
    }

    return data[0] as Destination;
  } catch (error) {
    console.error('Error in updateDestination:', error);
    return null;
  }
}

export async function deleteDestination(id: string) {
  try {
    const { error } = await supabase
      .from('destinations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting destination:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDestination:', error);
    return false;
  }
}

// FREIGHT RATE FUNCTIONS
export async function getFreightRates() {
  try {
    const { data, error } = await supabase
      .from('freight_rates')
      .select(`
        id, destination_id, min_weight, max_weight, base_rate, effective_date, user_id,
        destinations ( country, port )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching freight rates:', error);
      return [];
    }

    return data as (Pick<FreightRate, 'id' | 'destination_id' | 'min_weight' | 'max_weight' | 'base_rate' | 'effective_date' | 'user_id'> & {
      destinations: Pick<Destination, 'country' | 'port'>[] | null;
    })[];
  } catch (error) {
    console.error('Error in getFreightRates:', error);
    return [];
  }
}

export async function getFreightRateById(id: string) {
  try {
    const { data, error } = await supabase
      .from('freight_rates')
      .select(`
         id, destination_id, min_weight, max_weight, base_rate, effective_date, user_id,
         destinations ( country, port )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching freight rate:', error);
      return null;
    }

    return data as Pick<FreightRate, 'id' | 'destination_id' | 'min_weight' | 'max_weight' | 'base_rate' | 'effective_date' | 'user_id'> & {
       destinations: Pick<Destination, 'country' | 'port'>[] | null;
    };
  } catch (error) {
    console.error('Error in getFreightRateById:', error);
    return null;
  }
}

export async function createFreightRate(rate: Omit<FreightRate, 'id' | 'created_at' | 'updated_at' | 'currency' | 'vehicle_type' | 'container_size'>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("User not authenticated to create freight rate.");
    }

    const dataToSave = {
      destination_id: rate.destination_id,
      min_weight: rate.min_weight,
      max_weight: rate.max_weight,
      base_rate: rate.base_rate,
      effective_date: rate.effective_date,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('freight_rates')
      .insert([dataToSave])
      .select();

    if (error) {
      console.error('Error creating freight rate:', error);
      return null;
    }

    return data[0] as FreightRate;
  } catch (error) {
    console.error('Error in createFreightRate:', error);
    return null;
  }
}

export async function updateFreightRate(id: string, updates: Partial<Omit<FreightRate, 'currency' | 'vehicle_type' | 'container_size'>>) {
  try {
    // Prefix unused variables with _
    const { user_id: _user_id, destination_id: _destination_id, id: _rateId, created_at: _created_at, updated_at: _updated_at, ...restUpdates } = updates;

    const { data, error } = await supabase
      .from('freight_rates')
      .update(restUpdates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating freight rate:', error);
      return null;
    }

    return data[0] as FreightRate;
  } catch (error: unknown) { // Type error as unknown
    console.error('Exception in updateFreightRate:', error);
    return null;
  }
}

export async function deleteFreightRate(id: string) {
  try {
    const { error } = await supabase
      .from('freight_rates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting freight rate:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFreightRate:', error);
    return false;
  }
}

// QUOTATION FUNCTIONS
export async function getQuotations(userId: string) {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching quotations:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getQuotations:', error);
    return null;
  }
}

// Fetches a single quotation by its ID, selecting all columns
export async function getQuotationById(id: string): Promise<Quotation | null> {
  try {
    console.log('Fetching quotation by ID:', id);
    const { data, error } = await supabase
      .from('quotations')
      .select('*') // Select all columns to match the full Quotation interface
      .eq('id', id)
      .single();

    if (error) {
      // Log specific error if it's a "not found" error
      if (error.code === 'PGRST116') { // PostgREST: Row not found
        console.warn(`Quotation with ID ${id} not found.`);
      } else {
        console.error('Error fetching quotation by ID:', error);
      }
      return null;
    }

    if (!data) {
        console.warn(`No data returned for quotation ID ${id}, though no error reported.`);
        return null;
    }

    console.log('Quotation data fetched:', data);
    // Cast the result to the full Quotation type
    // Supabase should handle JSONB parsing automatically
    return data as Quotation;

  } catch (error) {
    console.error('Exception in getQuotationById:', error);
    return null;
  }
}

// Type for creating a new quotation (without DB-generated fields)
export type NewQuotationData = Omit<Quotation, 'id' | 'created_at' | 'updated_at'>;

export async function saveQuotation(quotationData: NewQuotationData): Promise<Quotation | null> {
  try {
    console.log('Saving new quotation:', quotationData);

    // Check for required fields
    if (!quotationData.user_id || !quotationData.company_id || !quotationData.destination_id) {
      console.error('Missing required fields for quotation:', 
        !quotationData.user_id ? 'user_id' : '',
        !quotationData.company_id ? 'company_id' : '',
        !quotationData.destination_id ? 'destination_id' : ''
      );
      throw new Error('Missing required fields for quotation');
    }

    // Ensure pallets is a valid array
    if (!Array.isArray(quotationData.pallets) || quotationData.pallets.length === 0) {
      console.error('Invalid or empty pallets array');
      throw new Error('At least one pallet is required');
    }

    // Prepare data - sanitize any fields that could cause database issues
    const sanitizedData = {
      ...quotationData,
      // Convert any undefined values to null for PostgreSQL compatibility
      contract_no: quotationData.contract_no || null,
      notes: quotationData.notes || null,
      // Ensure JSONB fields are properly formatted
      pallets: Array.isArray(quotationData.pallets) ? quotationData.pallets : [],
      additional_charges: Array.isArray(quotationData.additional_charges) ? quotationData.additional_charges : []
    };

    const { data, error } = await supabase
      .from('quotations')
      .insert([sanitizedData])
      .select() // Select all columns of the newly created row
      .single(); // Expecting one row back

    if (error) {
      console.error('Error saving quotation:', error);
      
      // More detailed error reporting based on error type
      if (error.code === '23505') {
        console.error('Unique constraint violation. A record with these values already exists.');
        throw new Error('A quotation with these details already exists');
      } else if (error.code === '23503') {
        console.error('Foreign key constraint violation. Referenced record does not exist.');
        throw new Error('One of the referenced records (company, destination) does not exist');
      } else if (error.code === '23502') {
        console.error('Not null constraint violation. A required field is missing.');
        throw new Error('A required field is missing');
      } else {
        // Generic database error
        throw new Error(`Database error: ${error.message || 'Unknown error'}`);
      }
    }

    if (!data) {
      console.error('No data returned after saving quotation, though no error reported.');
      throw new Error('Failed to save quotation - no data returned');
    }

    console.log('Quotation saved successfully:', data);
    // Cast the returned data to the full Quotation type
    return data as Quotation;

  } catch (error: unknown) { // Type error as unknown
    console.error('Exception in saveQuotation:', error);
    // Return null to indicate failure, with error message logged
    if (error instanceof Error && error.message) { // Check if error is an Error instance
      console.error('Error message:', error.message);
    }
    throw error; // Throw the error so the calling function can handle it
  }
}

// Update the Quotation in the database
// Accepts a partial Quotation object, but ensure it matches the updated interface
export async function updateQuotation(id: string, updates: Partial<Omit<Quotation, 'id' | 'created_at' | 'user_id'>>): Promise<Quotation | null> {
  try {
    console.log('Updating quotation:', id, updates);

    const { data, error } = await supabase
      .from('quotations')
      .update(updates)
      .eq('id', id)
      .select()
      .single(); // Expecting a single row back

    if (error) {
      console.error('Error updating quotation:', error);
      // Check for specific errors like RLS violation or not found
      if (error.code === 'PGRST204') { // PostgREST: No rows found
        console.warn(`Quotation with ID ${id} not found for update.`);
        return null;
      }
      throw error; // Re-throw other errors
    }

    console.log('Quotation updated successfully:', data);
    return data as Quotation; // Cast to the full Quotation type

  } catch (error) {
    console.error('Exception in updateQuotation:', error);
    return null;
  }
}

export async function deleteQuotation(id: string) {
  try {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting quotation:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteQuotation:', error);
    return false;
  }
}

// DOCUMENT SUBMISSION FUNCTIONS
export async function getDocumentSubmissions(quotationId?: string) {
  try {
    let query = supabase
      .from('document_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (quotationId) {
      query = query.eq('quotation_id', quotationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching document submissions:', error);
      return [];
    }

    return data as DocumentSubmission[];
  } catch (error) {
    console.error('Error in getDocumentSubmissions:', error);
    return [];
  }
}

export async function getDocumentSubmissionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('document_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching document submission:', error);
      return null;
    }

    return data as DocumentSubmission;
  } catch (error) {
    console.error('Error in getDocumentSubmissionById:', error);
    return null;
  }
}

export async function createDocumentSubmission(submission: Omit<DocumentSubmission, 'id' | 'submitted_at'>) {
  try {
    const { data, error } = await supabase
      .from('document_submissions')
      .insert([submission])
      .select();

    if (error) {
      console.error('Error creating document submission:', error);
      return null;
    }

    return data[0] as DocumentSubmission;
  } catch (error) {
    console.error('Error in createDocumentSubmission:', error);
    return null;
  }
}

export async function updateDocumentSubmission(id: string, updates: Partial<DocumentSubmission>) {
  try {
    const { data, error } = await supabase
      .from('document_submissions')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating document submission:', error);
      return null;
    }

    return data[0] as DocumentSubmission;
  } catch (error) {
    console.error('Error in updateDocumentSubmission:', error);
    return null;
  }
}

export async function deleteDocumentSubmission(id: string) {
  try {
    const { error } = await supabase
      .from('document_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document submission:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDocumentSubmission:', error);
    return false;
  }
}

// SETTINGS FUNCTIONS
export async function getSettings(category?: string) {
  try {
    let query = supabase
      .from('settings')
      .select('*');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching settings:', error);
      return [];
    }

    return data as Setting[];
  } catch (error) {
    console.error('Error in getSettings:', error);
    return [];
  }
}

export async function getSetting(category: string, key: string) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('category', category)
      .eq('settings_key', key)
      .single();

    if (error) {
      console.error('Error fetching setting:', error);
      return null;
    }

    return data as Setting;
  } catch (error) {
    console.error('Error in getSetting:', error);
    return null;
  }
}

export async function createOrUpdateSetting(
  category: string,
  key: string,
  value: Record<string, any>,
  userId: string
) {
  try {
    const { data: existingSetting } = await supabase
      .from('settings')
      .select('*')
      .eq('category', category)
      .eq('settings_key', key)
      .maybeSingle();

    if (existingSetting) {
      const { data, error } = await supabase
        .from('settings')
        .update({
          settings_value: value,
          user_id: userId
        })
        .eq('id', existingSetting.id)
        .select();

      if (error) {
        console.error('Error updating setting:', error);
        return null;
      }

      return data[0] as Setting;
    } else {
      const { data, error } = await supabase
        .from('settings')
        .insert([{
          category,
          settings_key: key,
          settings_value: value,
          user_id: userId
        }])
        .select();

      if (error) {
        console.error('Error creating setting:', error);
        return null;
      }

      return data[0] as Setting;
    }
  } catch (error) {
    console.error('Error in createOrUpdateSetting:', error);
    return null;
  }
}

export async function deleteSetting(id: string) {
  try {
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSetting:', error);
    return false;
  }
} 