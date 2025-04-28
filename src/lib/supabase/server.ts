import { createClient } from '@supabase/supabase-js'

// Ensure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables
// DO NOT expose the service role key publicly
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable SUPABASE_URL')
}
if (!supabaseServiceRoleKey) {
  throw new Error('Missing environment variable SUPABASE_SERVICE_ROLE_KEY')
}

// Create a Supabase client configured for server-side use (e.g., in API routes)
const supabaseServerClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Server-side client typically doesn't need to persist session or auto-refresh
    autoRefreshToken: false,
    persistSession: false,
  }
})

export default supabaseServerClient 