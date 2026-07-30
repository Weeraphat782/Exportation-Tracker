import { NextRequest, NextResponse } from 'next/server';
import { getFromR2 } from '@/lib/r2';

/** Serves social-artwork images from R2 same-origin, so canvas export never hits CORS. */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key') || '';
  if (!key.startsWith('social-artwork/')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const obj = await getFromR2(key);
  if (!obj) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(Buffer.from(obj.body), {
    headers: {
      'Content-Type': obj.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
