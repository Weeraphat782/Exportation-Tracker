import { supabase } from '@/lib/supabase';

/**
 * Absolute redirect URI for OAuth (must exactly match Dashboard → Redirect URLs).
 * Optional deep link under /portal after success.
 */
export function getCustomerSiteAuthCallbackUrl(origin: string, nextPath?: string | null): string {
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const u = new URL('/site/auth/callback', base);
  if (nextPath?.startsWith('/portal')) u.searchParams.set('next', nextPath);
  return u.toString();
}

export async function signInCustomerWithGoogle(
  origin: string,
  nextPortalPath?: string | null
): Promise<{ error?: string }> {
  const redirectTo = getCustomerSiteAuthCallbackUrl(origin, nextPortalPath);
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
