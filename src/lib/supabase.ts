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

// Log initial session for debugging
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data }) => {
    console.log('Initial session check:', data.session ? 'Session exists' : 'No session');
  });
} 