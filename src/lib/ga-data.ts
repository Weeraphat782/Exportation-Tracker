import { BetaAnalyticsDataClient, protos } from '@google-analytics/data';

type GaRow = protos.google.analytics.data.v1beta.IRow;

export interface GaDateRange {
  startDate: string;
  endDate: string;
}

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
  sessions: number;
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
}

let client: BetaAnalyticsDataClient | null = null;

/** Public marketing site path prefix — excludes internal staff app routes. */
const PUBLIC_PATH_PREFIX = process.env.GA_PUBLIC_PATH_PREFIX?.trim() || '/site';

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
  // Strip a single pair of surrounding quotes if they were kept in the value.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  // Convert literal escape sequences to real newlines, then drop carriage returns.
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

function priorRange(range: GaDateRange): GaDateRange {
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(prevStart), endDate: fmt(prevEnd) };
}

function sitePathFilter(
  fieldName: 'pagePath' | 'landingPage' = 'pagePath'
): protos.google.analytics.data.v1beta.IFilterExpression {
  return {
    filter: {
      fieldName,
      stringFilter: { matchType: 'BEGINS_WITH', value: PUBLIC_PATH_PREFIX },
    },
  };
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
  const previousRange = priorRange(range);
  const [current, previous] = await Promise.all([
    fetchTrafficTotals(range),
    fetchTrafficTotals(previousRange),
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

/** Run a report, returning an empty result instead of throwing. Used for
 * queries that may fail if an optional custom dimension is not registered. */
async function safeRunReport(
  request: protos.google.analytics.data.v1beta.IRunReportRequest
): Promise<GaRow[]> {
  try {
    const [response] = await getClient().runReport(request);
    return response.rows || [];
  } catch (err) {
    console.warn('GA optional report skipped:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getLeadConversions(range: GaDateRange): Promise<GaLeadSummary> {
  const previousRange = priorRange(range);
  const eventFilter: protos.google.analytics.data.v1beta.IFilterExpression = {
    filter: {
      fieldName: 'eventName',
      stringFilter: { matchType: 'EXACT', value: 'generate_lead' },
    },
  };

  const [total, previousTotal, byFormRows, bySourceRows, timeseriesRows] = await Promise.all([
    fetchLeadTotal(range),
    fetchLeadTotal(previousRange),
    // form_name is a custom dimension that must be registered in GA4; if it is
    // not, this query 400s, so keep it isolated and non-fatal.
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

  return {
    total,
    previousTotal,
    byFormName: byFormRows.map((row) => ({
      formName: parseDimension(row, 0) || '(not set)',
      count: parseMetric(row, 0),
    })),
    bySourceMedium: bySourceRows.map((row) => ({
      sourceMedium: parseDimension(row, 0) || '(not set)',
      count: parseMetric(row, 0),
    })),
    timeseries: timeseriesRows.map((row) => ({
      date: formatGaDate(parseDimension(row, 0)),
      count: parseMetric(row, 0),
    })),
  };
}

export async function getEntryLandingPages(
  range: GaDateRange,
  limit = 8
): Promise<GaLandingRow[]> {
  const rows = await safeRunReport({
    property: propertyPath(),
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: 'landingPage' }],
    metrics: [{ name: 'sessions' }, { name: 'entrances' }],
    dimensionFilter: sitePathFilter('landingPage'),
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit,
  });
  return rows.map((row) => ({
    landingPage: parseDimension(row, 0) || '/',
    sessions: parseMetric(row, 0),
    entrances: parseMetric(row, 1),
  }));
}

export async function getEntryChannels(
  range: GaDateRange,
  limit = 8
): Promise<GaChannelRow[]> {
  const rows = await safeRunReport({
    property: propertyPath(),
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: 'firstUserSourceMedium' }],
    metrics: [{ name: 'totalUsers' }],
    dimensionFilter: sitePathFilter(),
    orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    limit,
  });
  return rows.map((row) => ({
    sourceMedium: parseDimension(row, 0) || '(not set)',
    users: parseMetric(row, 0),
  }));
}

export function parseGaRange(rangeParam: string | null): GaDateRange {
  const days =
    rangeParam === '7d' ? 7 : rangeParam === '90d' ? 90 : 28;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}
