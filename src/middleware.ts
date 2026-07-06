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
const PUBLIC_SITE_PATHS = new Set([
  '/sitemap.xml',
  '/robots.txt',
  '/feed.xml',
  '/llms.txt',
  '/manifest.json',
]);

function isPublicMarketingPath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/site') || PUBLIC_SITE_PATHS.has(pathname);
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (!isPublicMarketingPath(request.nextUrl.pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

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
