import { NextResponse } from 'next/server';
import { triggerMarketingRebuild } from '@/lib/trigger-marketing-rebuild';

export const dynamic = 'force-dynamic';

/** POST /api/marketing/rebuild — triggers Astro marketing site GitHub Actions deploy. */
export async function POST() {
  const triggered = !!process.env.MARKETING_GITHUB_PAT;
  triggerMarketingRebuild('api');
  return NextResponse.json({ ok: true, triggered });
}
