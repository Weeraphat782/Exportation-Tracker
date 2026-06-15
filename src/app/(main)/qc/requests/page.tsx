'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Eye, QrCode, Search } from 'lucide-react';
import { getQcRequestsByStatus } from '@/lib/qc-db';
import type { QcRequest, QcRequestStatus } from '@/lib/qc-types';
import { QcScanDialog } from '@/components/qc/qc-scan-dialog';

const STATUS_TABS: { value: QcRequestStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'processing', label: 'Processing' },
  { value: 'complete', label: 'Complete' },
];

export default function QcRequestsQueuePage() {
  const [tab, setTab] = useState<QcRequestStatus>('new');
  const [requests, setRequests] = useState<QcRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scanOpen, setScanOpen] = useState(false);

  const load = async (status: QcRequestStatus) => {
    setLoading(true);
    setRequests(await getQcRequestsByStatus(status));
    setLoading(false);
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.qc_code.toLowerCase().includes(q) ||
        (r.sample_name || '').toLowerCase().includes(q) ||
        (r.company_name_address || '').toLowerCase().includes(q)
    );
  }, [requests, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-blue-600" />
            QC Requests
          </h1>
          <p className="text-slate-500">Lab work queue — New, Processing, Complete</p>
        </div>
        <Button onClick={() => setScanOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <QrCode className="h-4 w-4 mr-1" />
          Scan QR
        </Button>
      </div>

      <QcScanDialog open={scanOpen} onOpenChange={setScanOpen} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as QcRequestStatus)}>
        <TabsList>
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map((s) => (
          <TabsContent key={s.value} value={s.value}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle>{s.label} Requests</CardTitle>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Search QC code, sample…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-6 text-slate-500">Loading…</p>
                ) : filtered.length === 0 ? (
                  <p className="text-center py-6 text-slate-500">No requests in this folder.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>QC Code</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Sample</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-mono font-medium">{req.qc_code}</TableCell>
                          <TableCell>{req.qc_templates?.name || '—'}</TableCell>
                          <TableCell>{req.sample_name || '—'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {req.contact_name || req.company_name_address || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={req.payment_status === 'verified' ? 'default' : 'secondary'}>
                              {req.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {Number(req.grand_total || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/qc/requests/${req.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                Open
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
