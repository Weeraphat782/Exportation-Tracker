import { NextRequest, NextResponse } from 'next/server';
import { fetchAwbTracking, validateAwb } from '@/lib/thai-cargo-tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prefix = typeof body.prefix === 'string' ? body.prefix.trim() : '';
    const number = typeof body.number === 'string' ? body.number.replace(/\D/g, '') : '';

    const validationError = validateAwb(prefix, number);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await fetchAwbTracking(prefix, number);
    if (!result.found) {
      return NextResponse.json({ error: 'No tracking information found for this AWB.', found: false }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[track-awb]', err);
    const message = err instanceof Error ? err.message : 'Tracking request failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
