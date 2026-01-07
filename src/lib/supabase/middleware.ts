import { createClient as createSupabaseClient } from '@supabase/supabase-js'
// import { NextRequest /*, NextResponse */ } from 'next/server'

// This is a dummy implementation since the middleware is currently disabled
export function createClient(/* _request: NextRequest */) {
  // Get Supabase URL and key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Create a simple Supabase client
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  
  return supabase;
} 