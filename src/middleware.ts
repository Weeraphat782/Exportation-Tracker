import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response object
  const res = NextResponse.next();

  try {
    // Create Supabase client with cookies
    const supabase = createMiddlewareClient({ req: request, res });

    // Refresh session if expired - required for Server Components
    // This will also set the cookies properly for RLS to work
    await supabase.auth.getSession();

  } catch (error) {
    console.error('Middleware error:', error);
  }

  // Allow all requests to pass through
  // Authentication check is handled by individual pages
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
