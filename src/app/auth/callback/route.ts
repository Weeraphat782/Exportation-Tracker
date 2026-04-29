import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Allowed relative paths after email/OAuth redirects that use cookie-based sessions.
 * Customer Google login uses `/site/auth/callback` instead (browser localStorage).
 */
function resolveSafeRedirect(searchParams: URLSearchParams, fallback: string): string {
  const raw = searchParams.get('next');
  if (
    !raw ||
    !raw.startsWith('/') ||
    raw.startsWith('//') ||
    raw.includes('..') ||
    raw.includes(':\\') ||
    raw.includes('://')
  ) {
    return fallback;
  }
  const prefixes = ['/packing-list', '/shipping-calculator', '/portal', '/site', '/documents-upload', '/documents'];
  if (prefixes.some((p) => raw === p || raw.startsWith(`${p}/`))) {
    return raw;
  }
  return fallback;
}

/** Handle Supabase OAuth/email redirect with ?code — sets cookie-backed session then redirects */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
  }

  const dest = resolveSafeRedirect(url.searchParams, '/packing-list');
  return NextResponse.redirect(new URL(dest, request.url));
}
