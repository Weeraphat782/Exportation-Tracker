import { NextResponse } from 'next/server';

const PRODUCTION_ORIGINS = [
  'http://localhost:4321',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:4321',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://web.omgexp.com',
  'https://www.omgcargo.tech',
  'https://omgcargo.tech',
];

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function resolveMarketingOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const extra = process.env.MARKETING_SITE_ORIGIN?.split(',').map((s) => s.trim()) ?? [];
  const allowed = [...PRODUCTION_ORIGINS, ...extra];
  if (allowed.includes(origin)) return origin;
  if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return origin;
  if (process.env.NODE_ENV === 'development' && LOCAL_ORIGIN.test(origin)) return origin;
  return null;
}

export function marketingCorsHeaders(origin: string | null): HeadersInit {
  const o = resolveMarketingOrigin(origin);
  if (!o) return {};
  const allowHeaders =
    process.env.NODE_ENV === 'development' ? '*' : 'Content-Type, Authorization';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': allowHeaders,
  };
}

export function marketingJsonResponse(
  data: unknown,
  status: number,
  origin: string | null
): NextResponse {
  return NextResponse.json(data, { status, headers: marketingCorsHeaders(origin) });
}

export function marketingOptionsResponse(origin: string | null): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: marketingCorsHeaders(origin),
  });
}
