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
  getMicroConversions,
  getDeviceBreakdown,
  getCountryBreakdown,
  buildChannelPerformance,
  conversionRate,
} from '@/lib/ga-data';
import { getGscDashboard } from '@/lib/gsc-data';

export const dynamic = 'force-dynamic';

// ponytail: per-instance memory cache — upgrade path: Redis or Supabase if multi-instance
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { expires: number; body: unknown }>();

function getCached(key: string): unknown | null {
  const hit = cache.get(key);
  if (!hit || hit.expires <= Date.now()) return null;
  return hit.body;
}

function setCached(key: string, body: unknown) {
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, body });
}

export async function GET(request: Request) {
  const auth = await requireAdminApiUser(request);
  if (!auth.ok) return auth.response;

  if (!isGaConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const { searchParams } = new URL(request.url);
  const rangeKey = searchParams.get('range') || '28d';
  const cacheKey = `ga:v2:${rangeKey}`;

  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const range = parseGaRange(rangeKey);

  try {
    const [
      landingResult,
      leads,
      microConversionsResult,
      deviceResult,
      countryResult,
      gsc,
      ...rest
    ] = await Promise.all([
      getEntryLandingPages(range),
      getLeadConversions(range),
      getMicroConversions(range),
      getDeviceBreakdown(range),
      getCountryBreakdown(range),
      getGscDashboard(range),
      getTrafficSummary(range),
      getSessionsTimeseries(range),
      getTopSources(range),
      getTopPages(range),
    ]);

    const [summary, sessionsSeries, topSources, topPages] = rest;

    const channelPerformance = buildChannelPerformance(
      topSources,
      leads.bySourceMedium
    );

    const warnings: string[] = [
      ...(leads.errors ?? []),
      ...(landingResult.error ? [`Landing pages: ${landingResult.error}`] : []),
      ...(microConversionsResult.error
        ? [`Micro-conversions: ${microConversionsResult.error}`]
        : []),
      ...(deviceResult.error ? [`Device breakdown: ${deviceResult.error}`] : []),
      ...(countryResult.error ? [`Country breakdown: ${countryResult.error}`] : []),
      ...(gsc.error ? [`Search Console: ${gsc.error}`] : []),
    ];

    const body = {
      configured: true,
      range,
      dataThrough: 'yesterday',
      summary,
      sessionsSeries,
      topSources,
      topPages,
      leads: {
        total: leads.total,
        previousTotal: leads.previousTotal,
        byPage: leads.byPage,
        bySourceMedium: leads.bySourceMedium,
        timeseries: leads.timeseries,
      },
      conversionRate: {
        current: conversionRate(leads.total, summary.sessions),
        previous: conversionRate(leads.previousTotal, summary.previous.sessions),
      },
      landingPages: landingResult.data,
      channelPerformance,
      microConversions: microConversionsResult.data,
      devices: deviceResult.data,
      countries: countryResult.data,
      searchConsole: gsc,
      warnings,
    };

    setCached(cacheKey, body);
    return NextResponse.json(body);
  } catch (err) {
    console.error('GA analytics error:', err);
    const message = err instanceof Error ? err.message : 'Failed to load analytics';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
