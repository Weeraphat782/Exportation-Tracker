import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware - Lightweight path-based routing guard
 * 
 * ระบบ auth หลักใช้ client-side (localStorage) ดังนั้น middleware 
 * ทำหน้าที่เป็น infrastructure layer เท่านั้น
 * - ป้องกัน API routes, static files ไม่ถูก redirect
 * - Layout-level guards ทำ role checking จริง (client-side)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(request: NextRequest) {
  // Allow all requests to pass through
  // Real auth checking is done at the layout level (client-side)
  // because the auth system uses localStorage, not cookies
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
