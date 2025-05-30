import { NextResponse } from 'next/server'; // Keep this one
// import type { NextRequest } from 'next/server'; // Remove this duplicate type import

// Middleware completely disabled to fix login issues
// All requests pass through without authentication checks
export function middleware(/* _request: NextRequest */) {
  console.log('Middleware disabled - allowing all requests to pass through');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}