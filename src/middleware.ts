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

const SEO_ENDPOINTS = new Set([
  '/sitemap.xml',
  '/robots.txt',
  '/feed.xml',
  '/llms.txt',
]);

function isPublicMarketingPath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/site') || PUBLIC_SITE_PATHS.has(pathname);
}

function isAuthPath(pathname: string): boolean {
  return (
    pathname.startsWith('/site/login') ||
    pathname.startsWith('/site/register') ||
    pathname.startsWith('/site/auth')
  );
}

/** Map legacy /site paths to Astro marketing paths (strip /site prefix). */
function toMarketingPath(pathname: string): string {
  if (pathname === '/' || pathname === '/site') return '/';
  if (pathname.startsWith('/site/')) return pathname.slice('/site'.length) || '/';
  return pathname;
}

/**
 * When NEXT_PUBLIC_MARKETING_URL is set (local/staging only), send marketing HTML
 * to the Astro site. Auth stays on this app. 301 for GSC after cutover.
 */
function marketingRedirect(request: NextRequest): NextResponse | null {
  const base = process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, '');
  if (!base) return null;

  const { pathname } = request.nextUrl;
  if (SEO_ENDPOINTS.has(pathname)) return null;
  if (isAuthPath(pathname)) return null;
  if (pathname !== '/' && !pathname.startsWith('/site')) return null;

  const target = new URL(toMarketingPath(pathname), base);
  target.search = request.nextUrl.search;
  return NextResponse.redirect(target, 301);
}

export function middleware(request: NextRequest) {
  const redirect = marketingRedirect(request);
  if (redirect) return redirect;

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
