'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Loader2, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
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
  GaChannelRow,
  GaLandingRow,
  GaLeadSummary,
  GaPageRow,
  GaSourceRow,
  GaTimeseriesPoint,
  GaTrafficSummary,
} from '@/lib/ga-data';

type RangeKey = '7d' | '28d' | '90d';

interface GaApiResponse {
  configured: boolean;
  error?: string;
  range?: { startDate: string; endDate: string };
  summary?: GaTrafficSummary;
  sessionsSeries?: GaTimeseriesPoint[];
  topSources?: GaSourceRow[];
  topPages?: GaPageRow[];
  leads?: GaLeadSummary;
  landingPages?: GaLandingRow[];
  entryChannels?: GaChannelRow[];
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
}: {
  title: string;
  value: number;
  previous?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-2xl tabular-nums">{value.toLocaleString()}</CardTitle>
          {previous !== undefined ? <DeltaBadge current={value} previous={previous} /> : null}
        </div>
      </CardHeader>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>('28d');
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<GaTrafficSummary | null>(null);
  const [sessionsSeries, setSessionsSeries] = useState<GaTimeseriesPoint[]>([]);
  const [topSources, setTopSources] = useState<GaSourceRow[]>([]);
  const [topPages, setTopPages] = useState<GaPageRow[]>([]);
  const [leads, setLeads] = useState<GaLeadSummary | null>(null);
  const [landingPages, setLandingPages] = useState<GaLandingRow[]>([]);
  const [entryChannels, setEntryChannels] = useState<GaChannelRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setLeads(body.leads ?? null);
      setLandingPages(body.landingPages ?? []);
      setEntryChannels(body.entryChannels ?? []);
    } catch {
      setError('Failed to load analytics');
    }
    setLoading(false);
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

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
              Public website (customer-facing) only — internal staff pages excluded
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard title="Users" value={summary.totalUsers} previous={summary.previous.totalUsers} />
            <KpiCard title="New users" value={summary.newUsers} previous={summary.previous.newUsers} />
            <KpiCard title="Sessions" value={summary.sessions} previous={summary.previous.sessions} />
            <KpiCard
              title="Page views"
              value={summary.screenPageViews}
              previous={summary.previous.screenPageViews}
            />
            <KpiCard title="Form leads" value={leads.total} previous={leads.previousTotal} />
          </div>

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
                  <Line type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalUsers" stroke="#059669" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How customers entered</CardTitle>
              <CardDescription>
                Landing pages and first-visit source / medium on the public site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Top landing pages</p>
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
                          {row.sessions.toLocaleString()} sessions ·{' '}
                          {row.entrances.toLocaleString()} entrances
                        </span>
                      </li>
                    ))}
                    {landingPages.length === 0 && (
                      <p className="text-slate-400 text-sm">No landing page data for this period</p>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    First-visit source / medium
                  </p>
                  <ul className="space-y-2 text-sm">
                    {entryChannels.map((row) => (
                      <li
                        key={row.sourceMedium}
                        className="flex justify-between gap-2 border-b border-slate-100 pb-2"
                      >
                        <span className="truncate text-slate-700" title={row.sourceMedium}>
                          {row.sourceMedium}
                        </span>
                        <span className="tabular-nums text-slate-500 shrink-0">
                          {row.users.toLocaleString()} users
                        </span>
                      </li>
                    ))}
                    {entryChannels.length === 0 && (
                      <p className="text-slate-400 text-sm">No channel data for this period</p>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

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
              <CardTitle className="text-base">Form conversions (generate_lead)</CardTitle>
              <CardDescription>
                Leads from website forms tracked via GTM — breakdown by form name and traffic source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leads.timeseries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" name="Leads" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">By form</p>
                  <ul className="space-y-1 text-sm">
                    {leads.byFormName.map((row) => (
                      <li key={row.formName} className="flex justify-between gap-2">
                        <span>{row.formName}</span>
                        <span className="tabular-nums text-slate-600">{row.count}</span>
                      </li>
                    ))}
                    {leads.byFormName.length === 0 && (
                      <p className="text-slate-400">No lead events yet</p>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">By source / medium</p>
                  <ul className="space-y-1 text-sm">
                    {leads.bySourceMedium.map((row) => (
                      <li key={row.sourceMedium} className="flex justify-between gap-2">
                        <span className="truncate" title={row.sourceMedium}>{row.sourceMedium}</span>
                        <span className="tabular-nums text-slate-600 shrink-0">{row.count}</span>
                      </li>
                    ))}
                    {leads.bySourceMedium.length === 0 && (
                      <p className="text-slate-400">No lead events yet</p>
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
