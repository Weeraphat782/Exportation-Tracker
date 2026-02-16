import { createClient } from '@supabase/supabase-js';

// These should be in .env.local file in a real app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Anonymous Key is missing. Authentication will not work.');
}

// Create client with explicit session handling settings
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token'
  }
});

// Note: No initial getSession() call here — it can hang if the token is expired
// and autoRefreshToken acquires the navigator lock.
// For customer portal, session-helper.ts handles proactive token refresh. 