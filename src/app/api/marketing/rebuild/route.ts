import { NextResponse } from 'next/server';
import { triggerMarketingRebuild } from '@/lib/trigger-marketing-rebuild';

export const dynamic = 'force-dynamic';

/** POST /api/marketing/rebuild — triggers Astro marketing site Vercel deploy hook. */
export async function POST() {
  triggerMarketingRebuild('api');
  return NextResponse.json({ ok: true });
}
