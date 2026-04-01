import { SupabaseClient, createClient } from '@supabase/supabase-js'

let supabaseServerClient: SupabaseClient | null = null;
let supabasePublicSiteClient: SupabaseClient | null = null;

/** Many hosts only set NEXT_PUBLIC_SUPABASE_URL; accept either name. */
function resolveSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
}

/**
 * Creates and returns a Supabase client instance for server-side use.
 * Ensures environment variables are checked only when the client is requested.
 * Returns null if environment variables are missing.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (supabaseServerClient) {
    return supabaseServerClient;
  }

  const supabaseUrl = resolveSupabaseUrl()
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('Missing environment variable: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
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
 * Client for server-rendered marketing (newsroom, resources, sitemap, feeds).
 * Prefers service role when set; otherwise uses the anon key (same as the CMS browser client).
 * This fixes production setups that only configure NEXT_PUBLIC_* and omit SUPABASE_SERVICE_ROLE_KEY.
 *
 * RLS must allow the chosen key to SELECT published rows (e.g. is_published = true or a permissive policy).
 */
export function getSupabasePublicSiteClient(): SupabaseClient | null {
  if (supabasePublicSiteClient) {
    return supabasePublicSiteClient;
  }

  const supabaseUrl = resolveSupabaseUrl()
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error(
      'Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL (public site / marketing)',
    )
    return null
  }
  if (!key) {
    console.error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY (public site / marketing)',
    )
    return null
  }

  supabasePublicSiteClient = createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return supabasePublicSiteClient
}

/**
 * Creates a separate Supabase client specifically for packing list operations
 * This client is isolated and won't interfere with user authentication
 */
export function getPackingListClient(): SupabaseClient | null {
  const supabaseUrl = resolveSupabaseUrl()
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