import { BetaAnalyticsDataClient, protos } from '@google-analytics/data';
import { type GaDateRange, parseGaRange, previousGaRange } from './ga-range';

export { parseGaRange, previousGaRange };
export type { GaDateRange };

type GaRow = protos.google.analytics.data.v1beta.IRow;

export interface GaTrafficSummary {
  sessions: number;
  totalUsers: number;
  newUsers: number;
  screenPageViews: number;
  previous: {
    sessions: number;
    totalUsers: number;
    newUsers: number;
    screenPageViews: number;
  };
}

export interface GaTimeseriesPoint {
  date: string;
  sessions: number;
  totalUsers: number;
}

export interface GaSourceRow {
  sourceMedium: string;
  sessions: number;
}

export interface GaPageRow {
  pagePath: string;
  screenPageViews: number;
}

export interface GaLandingRow {
  landingPage: string;
  entrances: number;
}

export interface GaChannelRow {
  sourceMedium: string;
  users: number;
}

export interface GaLeadSummary {
  total: number;
  previousTotal: number;
  byFormName: { formName: string; count: number }[];
  bySourceMedium: { sourceMedium: string; count: number }[];
  timeseries: { date: string; count: number }[];
  errors: string[];
}

export interface GaSectionResult<T> {
  data: T;
  error?: string;
}

let client: BetaAnalyticsDataClient | null = null;

/** Public marketing site path prefix — excludes internal staff app routes. */
const PUBLIC_PATH_PREFIX = process.env.GA_PUBLIC_PATH_PREFIX?.trim() || '/site';
const MARKETING_GA_HOSTNAME =
  process.env.MARKETING_GA_HOSTNAME?.trim() || 'www.omgcargo.tech';

function getPropertyId(): string | null {
  const id = process.env.GA4_PROPERTY_ID?.trim();
  return id || null;
}

export function isGaConfigured(): boolean {
  const email = process.env.GA_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  return Boolean(getPropertyId() && email && key);
}

/**
 * Normalize a PEM private key coming from an env var. Handles all the common
 * breakages: surrounding quotes left in the value, literal `\n` sequences that
 * were not expanded, Windows `\r\n`, and stray whitespace. Without this, OpenSSL
 * throws "DECODER routines::unsupported".
 */
function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r/g, '');
  return key.trim() + '\n';
}

function getClient(): BetaAnalyticsDataClient {
  if (!isGaConfigured()) {
    throw new Error('GA4 is not configured');
  }
  if (!client) {
    const privateKey = normalizePrivateKey(process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY!);
    client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA_SERVICE_ACCOUNT_EMAIL!.trim(),
        private_key: privateKey,
      },
    });
  }
  return client;
}

function propertyPath(): string {
  return `properties/${getPropertyId()}`;
}

function parseMetric(row: GaRow | undefined | null, index = 0): number {
  const raw = row?.metricValues?.[index]?.value;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function parseDimension(row: GaRow | undefined | null, index = 0): string {
  return row?.dimensionValues?.[index]?.value?.trim() || '';
}

function formatGaDate(dateStr: string): string {
  if (dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

function sitePathFilter(
  fieldName: 'pagePath' | 'landingPage' = 'pagePath'
): protos.google.analytics.data.v1beta.IFilterExpression {
  const legacyPath: protos.google.analytics.data.v1beta.IFilterExpression = {
    filter: {
      fieldName,
      stringFilter: { matchType: 'BEGINS_WITH', value: PUBLIC_PATH_PREFIX },
    },
  };
  const newDomain: protos.google.analytics.data.v1beta.IFilterExpression = {
    filter: {
      fieldName: 'hostName',
      stringFilter: { matchType: 'EXACT', value: MARKETING_GA_HOSTNAME },
    },
  };
  return { orGroup: { expressions: [newDomain, legacyPath] } };
}

function withSiteFilter(
  extra?: protos.google.analytics.data.v1beta.IFilterExpression
): protos.google.analytics.data.v1beta.IFilterExpression {
  const site = sitePathFilter();
  if (!extra) return site;
  return { andGroup: { expressions: [site, extra] } };
}

async function fetchTrafficTotals(range: GaDateRange) {
  const [response] = await getClient().runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'screenPageViews' },
    ],
    dimensionFilter: sitePathFilter(),
  });
  const row = response.rows?.[0];
  return {
    sessions: parseMetric(row, 0),
    totalUsers: parseMetric(row, 1),
    newUsers: parseMetric(row, 2),
    screenPageViews: parseMetric(row, 3),
  };
}

export async function getTrafficSummary(range: GaDateRange): Promise<GaTrafficSummary> {
  const prev = previousGaRange(range);
  const [current, previous] = await Promise.all([
    fetchTrafficTotals(range),
    fetchTrafficTotals(prev),
  ]);
  return { ...current, previous };
}

export async function getSessionsTimeseries(range: GaDateRange): Promise<GaTimeseriesPoint[]> {
  const [response] = await getClient().runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    dimensionFilter: sitePathFilter(),
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  });
  return (response.rows || []).map((row) => ({
    date: formatGaDate(parseDimension(row, 0)),
    sessions: parseMetric(row, 0),
    totalUsers: parseMetric(row, 1),
  }));
}

export async function getTopSources(range: GaDateRange, limit = 8): Promise<GaSourceRow[]> {
  const [response] = await getClient().runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'sessions' }],
    dimensionFilter: sitePathFilter(),
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit,
  });
  return (response.rows || []).map((row) => ({
    sourceMedium: parseDimension(row, 0) || '(not set)',
    sessions: parseMetric(row, 0),
  }));
}

export async function getTopPages(range: GaDateRange, limit = 8): Promise<GaPageRow[]> {
  const [response] = await getClient().runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: sitePathFilter(),
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit,
  });
  return (response.rows || []).map((row) => ({
    pagePath: parseDimension(row, 0) || '/',
    screenPageViews: parseMetric(row, 0),
  }));
}

async function fetchLeadTotal(range: GaDateRange): Promise<number> {
  const eventFilter: protos.google.analytics.data.v1beta.IFilterExpression = {
    filter: {
      fieldName: 'eventName',
      stringFilter: { matchType: 'EXACT', value: 'generate_lead' },
    },
  };
  const [response] = await getClient().runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: withSiteFilter(eventFilter),
  });
  return parseMetric(response.rows?.[0], 0);
}

async function safeRunReport(
  request: protos.google.analytics.data.v1beta.IRunReportRequest
): Promise<{ rows: GaRow[]; error?: string }> {
  try {
    const [response] = await getClient().runReport(request);
    return { rows: response.rows || [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('GA report failed:', message);
    return { rows: [], error: message };
  }
}

export async function getLeadConversions(range: GaDateRange): Promise<GaLeadSummary> {
  const prev = previousGaRange(range);
  const eventFilter: protos.google.analytics.data.v1beta.IFilterExpression = {
    filter: {
      fieldName: 'eventName',
      stringFilter: { matchType: 'EXACT', value: 'generate_lead' },
    },
  };

  const [total, previousTotal, byFormResult, bySourceResult, timeseriesResult] =
    await Promise.all([
      fetchLeadTotal(range),
      fetchLeadTotal(prev),
      safeRunReport({
        property: propertyPath(),
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: [{ name: 'customEvent:form_name' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: withSiteFilter(eventFilter),
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      }),
      safeRunReport({
        property: propertyPath(),
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: withSiteFilter(eventFilter),
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 8,
      }),
      safeRunReport({
        property: propertyPath(),
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: withSiteFilter(eventFilter),
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
    ]);

  const errors: string[] = [];
  if (byFormResult.error) errors.push(`Lead breakdown by form: ${byFormResult.error}`);
  if (bySourceResult.error) errors.push(`Lead breakdown by source: ${bySourceResult.error}`);
  if (timeseriesResult.error) errors.push(`Lead timeseries: ${timeseriesResult.error}`);

  return {
    total,
    previousTotal,
    byFormName: byFormResult.rows.map((row) => ({
      formName: parseDimension(row, 0) || '(not set)',
      count: parseMetric(row, 0),
    })),
    bySourceMedium: bySourceResult.rows.map((row) => ({
      sourceMedium: parseDimension(row, 0) || '(not set)',
      count: parseMetric(row, 0),
    })),
    timeseries: timeseriesResult.rows.map((row) => ({
      date: formatGaDate(parseDimension(row, 0)),
      count: parseMetric(row, 0),
    })),
    errors,
  };
}

/** Top entry pages by entrances — pagePath is event-scoped and pairs with hostName filter. */
export async function getEntryLandingPages(
  range: GaDateRange,
  limit = 8
): Promise<GaSectionResult<GaLandingRow[]>> {
  const result = await safeRunReport({
    property: propertyPath(),
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'entrances' }],
    dimensionFilter: sitePathFilter('pagePath'),
    orderBys: [{ metric: { metricName: 'entrances' }, desc: true }],
    limit,
  });
  return {
    data: result.rows.map((row) => ({
      landingPage: parseDimension(row, 0) || '/',
      entrances: parseMetric(row, 0),
    })),
    error: result.error,
  };
}

export async function getEntryChannels(
  range: GaDateRange,
  limit = 8
): Promise<GaSectionResult<GaChannelRow[]>> {
  const result = await safeRunReport({
    property: propertyPath(),
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: 'firstUserSourceMedium' }],
    metrics: [{ name: 'totalUsers' }],
    dimensionFilter: sitePathFilter(),
    orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    limit,
  });
  return {
    data: result.rows.map((row) => ({
      sourceMedium: parseDimension(row, 0) || '(not set)',
      users: parseMetric(row, 0),
    })),
    error: result.error,
  };
}
