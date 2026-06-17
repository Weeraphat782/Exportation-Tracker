import { NextResponse } from 'next/server';
import { requireAdminApiUser } from '@/lib/api-auth';
import {
  isGaConfigured,
  parseGaRange,
  getTrafficSummary,
  getSessionsTimeseries,
  getTopSources,
  getTopPages,
  getLeadConversions,
  getEntryLandingPages,
  getEntryChannels,
} from '@/lib/ga-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAdminApiUser(request);
  if (!auth.ok) return auth.response;

  if (!isGaConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const { searchParams } = new URL(request.url);
  const range = parseGaRange(searchParams.get('range'));

  try {
    const [
      summary,
      sessionsSeries,
      topSources,
      topPages,
      leads,
      landingPages,
      entryChannels,
    ] = await Promise.all([
      getTrafficSummary(range),
      getSessionsTimeseries(range),
      getTopSources(range),
      getTopPages(range),
      getLeadConversions(range),
      getEntryLandingPages(range),
      getEntryChannels(range),
    ]);

    return NextResponse.json({
      configured: true,
      range,
      summary,
      sessionsSeries,
      topSources,
      topPages,
      leads,
      landingPages,
      entryChannels,
    });
  } catch (err) {
    console.error('GA analytics error:', err);
    const message = err instanceof Error ? err.message : 'Failed to load analytics';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
