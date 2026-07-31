import { JWT } from 'google-auth-library';
import { isGaConfigured, normalizePrivateKey } from './ga-data';
import {
  absoluteGaRange,
  previousAbsoluteRange,
  type GaDateRange,
} from './ga-range';

interface GscApiRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface GscSummary {
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  previous: {
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  };
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscTimeseriesPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscDashboardData {
  configured: boolean;
  error?: string;
  dataThrough?: string;
  summary?: GscSummary;
  topQueries?: GscQueryRow[];
  topPages?: GscPageRow[];
  timeseries?: GscTimeseriesPoint[];
}

export function isGscConfigured(): boolean {
  return isGaConfigured() && Boolean(process.env.GSC_SITE_URL?.trim());
}

function mapRow(row: GscApiRow, keyIndex = 0) {
  return {
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
    key: row.keys?.[keyIndex] ?? '',
  };
}

function aggregateTotals(rows: GscApiRow[]) {
  let clicks = 0;
  let impressions = 0;
  let positionWeighted = 0;
  for (const row of rows) {
    const imp = row.impressions ?? 0;
    clicks += row.clicks ?? 0;
    impressions += imp;
    positionWeighted += (row.position ?? 0) * imp;
  }
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? positionWeighted / impressions : 0,
  };
}

function formatGscDate(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

async function gscQuery(
  siteUrl: string,
  body: Record<string, unknown>
): Promise<GscApiRow[]> {
  const auth = new JWT({
    email: process.env.GA_SERVICE_ACCOUNT_EMAIL!.trim(),
    key: normalizePrivateKey(process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY!),
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const token = await auth.getAccessToken();
  if (!token.token) throw new Error('Failed to obtain Search Console access token');

  const encoded = encodeURIComponent(siteUrl);
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 400)}`);
  }

  const json = (await res.json()) as { rows?: GscApiRow[] };
  return json.rows ?? [];
}

export async function getGscDashboard(range: GaDateRange): Promise<GscDashboardData> {
  if (!isGscConfigured()) return { configured: false };

  const siteUrl = process.env.GSC_SITE_URL!.trim();
  const abs = absoluteGaRange(range.days);
  const prev = previousAbsoluteRange(abs);

  try {
    const [currentTotals, previousTotals, queryRows, pageRows, dateRows] =
      await Promise.all([
        gscQuery(siteUrl, {
          startDate: abs.startDate,
          endDate: abs.endDate,
          rowLimit: 1,
        }),
        gscQuery(siteUrl, {
          startDate: prev.startDate,
          endDate: prev.endDate,
          rowLimit: 1,
        }),
        gscQuery(siteUrl, {
          startDate: abs.startDate,
          endDate: abs.endDate,
          dimensions: ['query'],
          rowLimit: 10,
        }),
        gscQuery(siteUrl, {
          startDate: abs.startDate,
          endDate: abs.endDate,
          dimensions: ['page'],
          rowLimit: 10,
        }),
        gscQuery(siteUrl, {
          startDate: abs.startDate,
          endDate: abs.endDate,
          dimensions: ['date'],
          rowLimit: 1000,
        }),
      ]);

    const current = aggregateTotals(currentTotals);
    const previous = aggregateTotals(previousTotals);

    return {
      configured: true,
      dataThrough: abs.endDate,
      summary: { ...current, previous },
      topQueries: queryRows.map((row) => {
        const m = mapRow(row);
        return {
          query: m.key || '(not set)',
          clicks: m.clicks,
          impressions: m.impressions,
          ctr: m.ctr,
          position: m.position,
        };
      }),
      topPages: pageRows.map((row) => {
        const m = mapRow(row);
        return {
          page: m.key || '/',
          clicks: m.clicks,
          impressions: m.impressions,
          ctr: m.ctr,
          position: m.position,
        };
      }),
      timeseries: dateRows
        .map((row) => {
          const m = mapRow(row);
          return {
            date: formatGscDate(m.key),
            clicks: m.clicks,
            impressions: m.impressions,
            ctr: m.ctr,
            position: m.position,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('GSC query failed:', message);
    return { configured: true, error: message, dataThrough: abs.endDate };
  }
}
