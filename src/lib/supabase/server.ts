import { SupabaseClient, createClient } from '@supabase/supabase-js'

let supabaseServerClient: SupabaseClient | null = null;

/**
 * Creates and returns a Supabase client instance for server-side use.
 * Ensures environment variables are checked only when the client is requested.
 * Returns null if environment variables are missing.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (supabaseServerClient) {
    return supabaseServerClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('Missing environment variable: SUPABASE_URL')
    return null;
  }
  if (!supabaseServiceRoleKey) {
    console.error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY')
    return null;
  }

  // Create a Supabase client configured for server-side use
  supabaseServerClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  })

  return supabaseServerClient;
}

/**
 * Creates a separate Supabase client specifically for packing list operations
 * This client is isolated and won't interfere with user authentication
 */
export function getPackingListClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing environment variables for packing list client')
    return null;
  }

  // Create a fresh client instance for packing list operations
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public'
    }
  })
} 