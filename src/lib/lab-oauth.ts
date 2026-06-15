import { supabase } from '@/lib/supabase';

export function getLabAuthCallbackUrl(origin: string): string {
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return `${base}/auth/lab/callback`;
}

export async function signInLabAdminWithGoogle(origin: string): Promise<{ error?: string }> {
  const redirectTo = getLabAuthCallbackUrl(origin);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account', access_type: 'offline' },
    },
  });
  if (error) return { error: error.message };
  return {};
}
