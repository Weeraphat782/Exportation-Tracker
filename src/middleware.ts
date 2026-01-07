import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response object
  const res = NextResponse.next();

  // Create Supabase client with cookies
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired - required for Server Components
  // This will also set the cookies properly for RLS to work
  const { data: { session } } = await supabase.auth.getSession();

  // Log for debugging
  console.log('Middleware - Session:', session ? `User: ${session.user.email}` : 'No session');

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/reset-password', '/auth/callback', '/simple-login'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // If no session and trying to access protected route, redirect to login
  if (!session && !isPublicRoute && !request.nextUrl.pathname.startsWith('/company-onboarding')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If has session and trying to access login page, redirect to home
  if (session && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/simple-login')) {
    return NextResponse.redirect(new URL('/opportunities', request.url));
  }

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
