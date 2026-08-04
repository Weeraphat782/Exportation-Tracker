'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Loader2, TrendingDown, TrendingUp, BarChart3, AlertTriangle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileMenuButton } from '@/components/ui/mobile-menu-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type {
  GaBreakdownRow,
  GaChannelPerformanceRow,
  GaLandingRow,
  GaMicroConversionRow,
  GaPageRow,
  GaSourceRow,
  GaTimeseriesPoint,
  GaTrafficSummary,
} from '@/lib/ga-data';
import type {
  GscDashboardData,
  GscOpportunities,
  GscPageRow,
  GscQueryRow,
} from '@/lib/gsc-data';

type RangeKey = '7d' | '28d' | '90d';

interface LeadsPayload {
  total: number;
  previousTotal: number;
  byPage: { pagePath: string; count: number }[];
  bySourceMedium: { sourceMedium: string; count: number }[];
  timeseries: { date: string; count: number }[];
}

interface ConversionRatePayload {
  current: number;
  previous: number;
}

interface GaApiResponse {
  configured: boolean;
  error?: string;
  dataThrough?: string;
  warnings?: string[];
  range?: { startDate: string; endDate: string; days: number };
  summary?: GaTrafficSummary;
  sessionsSeries?: GaTimeseriesPoint[];
  topSources?: GaSourceRow[];
  topPages?: GaPageRow[];
  leads?: LeadsPayload & {
    byFormName?: { formName: string; count: number }[];
  };
  conversionRate?: ConversionRatePayload;
  landingPages?: GaLandingRow[];
  channelPerformance?: GaChannelPerformanceRow[];
  microConversions?: GaMicroConversionRow[];
  devices?: GaBreakdownRow[];
  countries?: GaBreakdownRow[];
  searchConsole?: GscDashboardData;
}

function normalizeLeads(raw: GaApiResponse['leads']): LeadsPayload | null {
  if (!raw) return null;
  const byPage =
    raw.byPage ??
    raw.byFormName?.map((row) => ({ pagePath: row.formName, count: row.count })) ??
    [];
  return {
    total: raw.total ?? 0,
    previousTotal: raw.previousTotal ?? 0,
    byPage,
    bySourceMedium: raw.bySourceMedium ?? [],
    timeseries: raw.timeseries ?? [],
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const delta = pctChange(current, previous);
  if (delta === null) return null;
  const up = delta >= 0;
  return (
    <Badge
      variant="outline"
      className={`text-xs ${up ? 'border-emerald-300 text-emerald-700' : 'border-red-300 text-red-700'}`}
    >
      {up ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
      {up ? '+' : ''}{delta.toFixed(0)}%
    </Badge>
  );
}

function KpiCard({
  title,
  value,
  previous,
  format = 'number',
}: {
  title: string;
  value: number;
  previous?: number;
  format?: 'number' | 'percent' | 'duration' | 'decimal';
}) {
  const display =
    format === 'percent'
      ? `${value.toFixed(1)}%`
      : format === 'duration'
        ? `${Math.round(value)}s`
        : format === 'decimal'
          ? value.toFixed(1)
          : value.toLocaleString();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-2xl tabular-nums">{display}</CardTitle>
          {previous !== undefined ? <DeltaBadge current={value} previous={previous} /> : null}
        </div>
      </CardHeader>
    </Card>
  );
}

function SectionEmpty({ unavailable, empty }: { unavailable?: string; empty: string }) {
  if (unavailable) {
    return <p className="text-amber-700 text-sm">Data unavailable — {unavailable}</p>;
  }
  return <p className="text-slate-400 text-sm">{empty}</p>;
}

const MICRO_LABELS: Record<string, string> = {
  generate_lead: 'Form submit',
  cta_click: 'CTA click',
  contact_click: 'Phone / email click',
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>('28d');
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [summary, setSummary] = useState<GaTrafficSummary | null>(null);
  const [sessionsSeries, setSessionsSeries] = useState<GaTimeseriesPoint[]>([]);
  const [topSources, setTopSources] = useState<GaSourceRow[]>([]);
  const [topPages, setTopPages] = useState<GaPageRow[]>([]);
  const [leads, setLeads] = useState<LeadsPayload | null>(null);
  const [conversionRateData, setConversionRateData] = useState<ConversionRatePayload | null>(null);
  const [landingPages, setLandingPages] = useState<GaLandingRow[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<GaChannelPerformanceRow[]>([]);
  const [microConversions, setMicroConversions] = useState<GaMicroConversionRow[]>([]);
  const [devices, setDevices] = useState<GaBreakdownRow[]>([]);
  const [countries, setCountries] = useState<GaBreakdownRow[]>([]);
  const [searchConsole, setSearchConsole] = useState<GscDashboardData | null>(null);
  const [landingError, setLandingError] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    setLandingError(undefined);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Not signed in');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/analytics/ga?range=${range}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body: GaApiResponse = await res.json();
      if (!res.ok) {
        setError(body.error || 'Failed to load analytics');
        setLoading(false);
        return;
      }
      if (!body.configured) {
        setConfigured(false);
        setLoading(false);
        return;
      }
      setConfigured(true);
      setSummary(body.summary ?? null);
      setSessionsSeries(body.sessionsSeries ?? []);
      setTopSources(body.topSources ?? []);
      setTopPages(body.topPages ?? []);
      setLeads(normalizeLeads(body.leads));
      setConversionRateData(body.conversionRate ?? null);
      setLandingPages(body.landingPages ?? []);
      setChannelPerformance(body.channelPerformance ?? []);
      setMicroConversions(body.microConversions ?? []);
      setDevices(body.devices ?? []);
      setCountries(body.countries ?? []);
      setSearchConsole(body.searchConsole ?? null);
      setWarnings(body.warnings ?? []);
      const warn = body.warnings ?? [];
      const landingWarn = warn.find((w) => w.startsWith('Landing pages:'));
      if (landingWarn) setLandingError(landingWarn.replace(/^Landing pages:\s*/, ''));
    } catch {
      setError('Failed to load analytics');
    }
    setLoading(false);
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const leadBreakdownWarnings = warnings.filter(
    (w) => w.startsWith('Lead breakdown') || w.startsWith('Lead timeseries')
  );

  const gsc = searchConsole?.configured ? searchConsole : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-slate-600" />
              Website Analytics
            </h1>
            <p className="text-sm text-slate-500">
              Public website only — GA4 through yesterday; Search Console lags ~3 days. Includes{' '}
              <span className="font-mono text-xs">www.omgcargo.tech</span> and legacy{' '}
              <span className="font-mono text-xs">/site/*</span> paths.
            </p>
          </div>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="28d">Last 28 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : !configured ? (
        <Card>
          <CardHeader>
            <CardTitle>Analytics not configured</CardTitle>
            <CardDescription>
              Set these environment variables and enable the Google Analytics Data API in Google Cloud:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-1 font-mono">
            <p>GA4_PROPERTY_ID</p>
            <p>GA_SERVICE_ACCOUNT_EMAIL</p>
            <p>GA_SERVICE_ACCOUNT_PRIVATE_KEY</p>
            <p>GA_PUBLIC_PATH_PREFIX</p>
            <p>MARKETING_GA_HOSTNAME</p>
            <p>GSC_SITE_URL</p>
            <p className="text-slate-500 font-sans mt-3">
              Grant the service account Viewer access on your GA4 property (Admin → Property access management).
            </p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Could not load analytics</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : summary && leads ? (
        <>
          {warnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  Partial data — some queries failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-amber-900 space-y-1 font-mono">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {gsc?.summary && (
            <>
              <div className="flex items-center gap-2 text-slate-700">
                <Search className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Google Search</h2>
                {gsc.dataThrough && (
                  <span className="text-xs text-slate-500">data through {gsc.dataThrough}</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  title="Search impressions"
                  value={gsc.summary.impressions}
                  previous={gsc.summary.previous.impressions}
                />
                <KpiCard
                  title="Search clicks"
                  value={gsc.summary.clicks}
                  previous={gsc.summary.previous.clicks}
                />
                <KpiCard
                  title="Search CTR"
                  value={gsc.summary.ctr * 100}
                  previous={gsc.summary.previous.ctr * 100}
                  format="percent"
                />
                <KpiCard
                  title="Avg position"
                  value={gsc.summary.position}
                  previous={gsc.summary.previous.position}
                  format="decimal"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Search clicks & impressions</CardTitle>
                  <CardDescription>
                    From Google Search Console — includes people who saw your site but did not click
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[260px]">
                  {(gsc.timeseries?.length ?? 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={gsc.timeseries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="linear"
                          dataKey="impressions"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                        />
                        <Line
                          yAxisId="right"
                          type="linear"
                          dataKey="clicks"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <SectionEmpty unavailable={gsc.error} empty="No search trend data" />
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GscQueryTable rows={gsc.topQueries ?? []} error={gsc.error} />
                <GscPageTable rows={gsc.topPages ?? []} error={gsc.error} />
              </div>

              {gsc.opportunities && (
                <GscOpportunitiesCard data={gsc.opportunities} siteCtr={gsc.summary.ctr} />
              )}
            </>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Users" value={summary.totalUsers} previous={summary.previous.totalUsers} />
            <KpiCard title="New users" value={summary.newUsers} previous={summary.previous.newUsers} />
            <KpiCard title="Sessions" value={summary.sessions} previous={summary.previous.sessions} />
            <KpiCard
              title="Engagement rate"
              value={summary.engagementRate * 100}
              previous={summary.previous.engagementRate * 100}
              format="percent"
            />
            <KpiCard title="Lead events" value={leads.total} previous={leads.previousTotal} />
            {conversionRateData && (
              <KpiCard
                title="Lead CVR"
                value={conversionRateData.current}
                previous={conversionRateData.previous}
                format="percent"
              />
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard
              title="Page views"
              value={summary.screenPageViews}
              previous={summary.previous.screenPageViews}
            />
            <KpiCard
              title="Engaged sessions"
              value={summary.engagedSessions}
              previous={summary.previous.engagedSessions}
            />
            <KpiCard
              title="Avg session duration"
              value={summary.averageSessionDuration}
              previous={summary.previous.averageSessionDuration}
              format="duration"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Micro-conversions</CardTitle>
              <CardDescription>
                Form submits, CTA clicks, and phone/email taps — events already tracked on the marketing site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {microConversions.map((row) => (
                  <div key={row.eventName} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      {MICRO_LABELS[row.eventName] ?? row.eventName}
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">{row.count.toLocaleString()}</p>
                  </div>
                ))}
                {microConversions.length === 0 && (
                  <SectionEmpty empty="No micro-conversion events in this period" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessions & users</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionsSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="linear" dataKey="sessions" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="linear" dataKey="totalUsers" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel performance</CardTitle>
              <CardDescription>
                Sessions vs lead events by source / medium — which channels convert
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Source / medium</th>
                    <th className="pb-2 pr-4 font-medium text-right">Sessions</th>
                    <th className="pb-2 pr-4 font-medium text-right">Leads</th>
                    <th className="pb-2 font-medium text-right">CVR</th>
                  </tr>
                </thead>
                <tbody>
                  {channelPerformance.map((row) => (
                    <tr key={row.sourceMedium} className="border-b border-slate-100">
                      <td className="py-2 pr-4 truncate max-w-[200px]" title={row.sourceMedium}>
                        {row.sourceMedium}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">{row.sessions.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{row.leads.toLocaleString()}</td>
                      <td className="py-2 text-right tabular-nums">
                        {row.conversionRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {channelPerformance.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4">
                        <SectionEmpty empty="No channel data for this period" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top entry pages</CardTitle>
              <CardDescription>First page in each session on the marketing site</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {landingPages.map((row) => (
                  <li
                    key={row.landingPage}
                    className="flex justify-between gap-2 border-b border-slate-100 pb-2"
                  >
                    <span className="truncate text-slate-700" title={row.landingPage}>
                      {row.landingPage}
                    </span>
                    <span className="tabular-nums text-slate-500 shrink-0 text-xs">
                      {row.sessions.toLocaleString()} sessions
                    </span>
                  </li>
                ))}
                {landingPages.length === 0 && (
                  <SectionEmpty
                    unavailable={landingError}
                    empty="No entry page data for this period"
                  />
                )}
              </ul>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BreakdownCard title="Device" rows={devices} />
            <BreakdownCard title="Country" rows={countries} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top sources</CardTitle>
                <CardDescription>Session source / medium</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSources} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="sourceMedium" width={120} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top pages</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {topPages.map((row) => (
                    <li key={row.pagePath} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="truncate text-slate-700" title={row.pagePath}>{row.pagePath}</span>
                      <span className="tabular-nums text-slate-500 shrink-0">
                        {row.screenPageViews.toLocaleString()}
                      </span>
                    </li>
                  ))}
                  {topPages.length === 0 && (
                    <p className="text-slate-400 text-sm">No data for this period</p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead events (generate_lead)</CardTitle>
              <CardDescription>
                GA4 event count from GTM — not unique people; repeated submits count separately
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leads.timeseries ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="linear" dataKey="count" name="Lead events" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Leads by page</p>
                  <p className="text-xs text-slate-500 mb-2">
                    Page where the lead event fired — not necessarily the first page in the session
                  </p>
                  <ul className="space-y-1 text-sm">
                    {(leads.byPage ?? []).map((row) => (
                      <li key={row.pagePath} className="flex justify-between gap-2">
                        <span className="truncate font-mono text-xs" title={row.pagePath}>
                          {row.pagePath}
                        </span>
                        <span className="tabular-nums text-slate-600 shrink-0">{row.count}</span>
                      </li>
                    ))}
                    {(leads.byPage ?? []).length === 0 && (
                      <SectionEmpty
                        unavailable={leadBreakdownWarnings.find((w) => w.includes('by page'))?.replace(/^Lead breakdown by page:\s*/, '')}
                        empty="No lead events in this period"
                      />
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">By source / medium</p>
                  <ul className="space-y-1 text-sm">
                    {(leads.bySourceMedium ?? []).map((row) => (
                      <li key={row.sourceMedium} className="flex justify-between gap-2">
                        <span className="truncate" title={row.sourceMedium}>{row.sourceMedium}</span>
                        <span className="tabular-nums text-slate-600 shrink-0">{row.count}</span>
                      </li>
                    ))}
                    {(leads.bySourceMedium ?? []).length === 0 && (
                      <SectionEmpty
                        unavailable={leadBreakdownWarnings.find((w) => w.includes('by source'))?.replace(/^Lead breakdown by source:\s*/, '')}
                        empty="No lead events in this period"
                      />
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: GaBreakdownRow[] }) {
  const total = rows.reduce((sum, r) => sum + r.sessions, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {rows.map((row) => (
            <li key={row.label} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-700">{row.label}</span>
              <span className="tabular-nums text-slate-500 shrink-0">
                {row.sessions.toLocaleString()}
                {total > 0 ? ` (${((row.sessions / total) * 100).toFixed(0)}%)` : ''}
              </span>
            </li>
          ))}
          {rows.length === 0 && <SectionEmpty empty={`No ${title.toLowerCase()} data`} />}
        </ul>
      </CardContent>
    </Card>
  );
}

function GscQueryTable({ rows, error }: { rows: GscQueryRow[]; error?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top search queries</CardTitle>
        <CardDescription>What people typed in Google before clicking</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {rows.map((row) => (
            <li key={row.query} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="truncate text-slate-700" title={row.query}>{row.query}</span>
              <span className="tabular-nums text-slate-500 shrink-0 text-xs">
                {row.clicks} clicks · {(row.ctr * 100).toFixed(1)}% CTR
              </span>
            </li>
          ))}
          {rows.length === 0 && (
            <SectionEmpty unavailable={error} empty="No query data for this period" />
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function GscPageTable({ rows, error }: { rows: GscPageRow[]; error?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top pages in search</CardTitle>
        <CardDescription>URLs that earned clicks from Google</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {rows.map((row) => (
            <li key={row.page} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="truncate text-slate-700 font-mono text-xs" title={row.page}>
                {row.page}
              </span>
              <span className="tabular-nums text-slate-500 shrink-0 text-xs">
                {row.clicks} clicks
              </span>
            </li>
          ))}
          {rows.length === 0 && (
            <SectionEmpty unavailable={error} empty="No page data for this period" />
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function GscOpportunitiesCard({ data, siteCtr }: { data: GscOpportunities; siteCtr: number }) {
  const siteCtrPct = (siteCtr * 100).toFixed(1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SEO opportunities</CardTitle>
        <CardDescription>
          Actions from Search Console — site CTR {(siteCtr * 100).toFixed(1)}% in this period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Striking distance</p>
            <p className="text-xs text-slate-500 mb-2">
              Queries ranking #5–20 — add a section or internal link targeting these terms
            </p>
            <ul className="space-y-2 text-sm">
              {data.strikingDistance.map((row) => (
                <li key={row.query} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="truncate text-slate-700" title={row.query}>{row.query}</span>
                  <span className="tabular-nums text-slate-500 shrink-0 text-xs">
                    pos {row.position.toFixed(1)} · {row.impressions.toLocaleString()} imp
                  </span>
                </li>
              ))}
              {data.strikingDistance.length === 0 && (
                <SectionEmpty empty="No queries in positions 5–20 yet" />
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Low CTR pages</p>
            <p className="text-xs text-slate-500 mb-2">
              High impressions but CTR below site average ({siteCtrPct}%) — rewrite title and meta description
            </p>
            <ul className="space-y-2 text-sm">
              {data.lowCtrPages.map((row) => (
                <li key={row.page} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="truncate font-mono text-xs text-slate-700" title={row.page}>
                    {row.page.replace(/^https?:\/\/[^/]+/, '') || '/'}
                  </span>
                  <span className="tabular-nums text-slate-500 shrink-0 text-xs">
                    ~{Math.round(row.missedClicks)} missed · {(row.ctr * 100).toFixed(1)}% CTR
                  </span>
                </li>
              ))}
              {data.lowCtrPages.length === 0 && (
                <SectionEmpty empty="No pages below site CTR in this period" />
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Zero-click queries</p>
            <p className="text-xs text-slate-500 mb-2">
              Shown in Google but nobody clicked — snippet or intent mismatch; consider a dedicated page
            </p>
            <ul className="space-y-2 text-sm">
              {data.zeroClickQueries.map((row) => (
                <li key={row.query} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="truncate text-slate-700" title={row.query}>{row.query}</span>
                  <span className="tabular-nums text-slate-500 shrink-0 text-xs">
                    {row.impressions.toLocaleString()} imp · pos {row.position.toFixed(1)}
                  </span>
                </li>
              ))}
              {data.zeroClickQueries.length === 0 && (
                <SectionEmpty empty="No zero-click queries in this period" />
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
