'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MobileMenuButton } from '@/components/ui/mobile-menu-button';
import {
  deleteProformaInvoice,
  getProformaInvoices,
  type ProformaInvoiceListItem,
} from '@/lib/db';
import { toast } from 'sonner';

function formatMoney(n: number | null | undefined) {
  if (n == null || isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB');
}

function proformaStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>;
    case 'sent':
      return <Badge variant="default">Sent</Badge>;
    case 'signed':
      return <Badge variant="success">Signed</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function ProformaInvoicesListPage() {
  const [rows, setRows] = useState<ProformaInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProformaInvoices();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const inv = (r.invoice_no || '').toLowerCase();
      const cust = (r.customer_name || '').toLowerCase();
      const qn = (r.quotation_no || '').toLowerCase();
      const comp = (r.company_name || '').toLowerCase();
      return inv.includes(q) || cust.includes(q) || qn.includes(q) || comp.includes(q);
    });
  }, [rows, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this proforma invoice? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const ok = await deleteProformaInvoice(id);
      if (!ok) {
        toast.error('Could not delete');
        return;
      }
      toast.success('Deleted');
      setRows((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <h1 className="text-2xl sm:text-3xl font-bold">Proforma Invoices</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All proforma invoices</CardTitle>
          <CardDescription>
            Created from quotations in{' '}
            <Link href="/shipping-calculator" className="text-primary underline-offset-4 hover:underline">
              Shipping Calculator
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoice no., customer, quotation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
              <p className="mb-2">No proforma invoices yet.</p>
              <p className="text-sm">
                Create one from a quotation in{' '}
                <Link href="/shipping-calculator" className="font-medium text-primary underline-offset-4 hover:underline">
                  Shipping Calculator
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Invoice No.</TableHead>
                    <TableHead className="whitespace-nowrap">Quotation No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Grand Total</TableHead>
                    <TableHead className="text-right w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(r.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">{r.invoice_no || '—'}</TableCell>
                      <TableCell>
                        <Link
                          href={`/shipping-calculator/preview?id=${r.quotation_id}`}
                          className="text-primary hover:underline"
                        >
                          {r.quotation_no || r.quotation_id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>{r.customer_name || r.company_name || '—'}</TableCell>
                      <TableCell>{proformaStatusBadge(r.status)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(r.grand_total)} THB</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/proforma-invoices/${r.id}/preview`}>
                              <Eye className="h-3.5 w-3.5 sm:mr-1" />
                              <span className="hidden sm:inline">Preview</span>
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/proforma-invoices/${r.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === r.id}
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
