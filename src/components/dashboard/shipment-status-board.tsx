'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Banknote,
  Loader2,
  Package,
  Plane,
  Truck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SHIPMENT_STATUS_LABELS,
  summarizeShipmentRows,
  type ShipmentOpStatus,
  type ShipmentStatusRow,
} from '@/lib/shipment-status';

interface ShipmentStatusBoardProps {
  rows: ShipmentStatusRow[];
  isLoading?: boolean;
  onPaymentUpdated?: () => void | Promise<void>;
}

type FilterKey = 'all' | ShipmentOpStatus;

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

const STATUS_BADGE: Record<ShipmentOpStatus, 'warning' | 'success' | 'destructive' | 'orange'> = {
  awaiting_payment: 'warning',
  paid_ready_to_ship: 'success',
  shipped_unpaid: 'destructive',
  shipped_and_paid: 'orange',
};

function formatThb(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
}

function KpiCard({
  title,
  count,
  amount,
  icon: Icon,
  accentClass,
  highlight,
}: {
  title: string;
  count: number;
  amount: number;
  icon: React.ElementType;
  accentClass: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-red-300 bg-red-50/40 shadow-sm' : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground mt-1">shipment{count === 1 ? '' : 's'}</p>
        <p className="text-sm font-semibold text-slate-700 mt-2">{formatThb(amount)}</p>
      </CardContent>
    </Card>
  );
}

export function ShipmentStatusBoard({ rows, isLoading, onPaymentUpdated }: ShipmentStatusBoardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [savingPaymentId, setSavingPaymentId] = useState<string | null>(null);
  const summary = useMemo(() => summarizeShipmentRows(rows), [rows]);

  const handlePaymentDateChange = async (opportunityId: string, date: string) => {
    setSavingPaymentId(opportunityId);
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ payment_date: date || null })
        .eq('id', opportunityId);
      if (error) throw error;
      toast.success(date ? 'Payment date saved' : 'Payment date cleared');
      await onPaymentUpdated?.();
    } catch (err) {
      console.error('Error updating payment date:', err);
      toast.error('Could not save payment date');
    } finally {
      setSavingPaymentId(null);
    }
  };

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((r) => r.opStatus === filter);
  }, [rows, filter]);

  const totalFiltered = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);
  const rangeStart = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalFiltered);

  useEffect(() => {
    setPage(1);
  }, [filter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Shipment Status</CardTitle>
          <CardDescription>Loading payment and shipment overview…</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Shipment Status</h2>
        <p className="text-sm text-muted-foreground">
          Active shipments by payment and shipping status — {summary.total.count} total
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title={SHIPMENT_STATUS_LABELS.awaiting_payment}
          count={summary.awaiting_payment.count}
          amount={summary.awaiting_payment.amount}
          icon={Banknote}
          accentClass="bg-amber-100 text-amber-700"
        />
        <KpiCard
          title={SHIPMENT_STATUS_LABELS.paid_ready_to_ship}
          count={summary.paid_ready_to_ship.count}
          amount={summary.paid_ready_to_ship.amount}
          icon={Truck}
          accentClass="bg-emerald-100 text-emerald-700"
        />
        <KpiCard
          title={SHIPMENT_STATUS_LABELS.shipped_unpaid}
          count={summary.shipped_unpaid.count}
          amount={summary.shipped_unpaid.amount}
          icon={AlertTriangle}
          accentClass="bg-red-100 text-red-700"
          highlight={summary.shipped_unpaid.count > 0}
        />
        <KpiCard
          title={SHIPMENT_STATUS_LABELS.shipped_and_paid}
          count={summary.shipped_and_paid.count}
          amount={summary.shipped_and_paid.amount}
          icon={Plane}
          accentClass="bg-orange-100 text-orange-700"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-base">Shipment list</CardTitle>
          </div>
          <CardDescription>Click a row to open the booking card</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
            <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
              <TabsTrigger value="all">All ({summary.total.count})</TabsTrigger>
              <TabsTrigger value="awaiting_payment">
                Awaiting Payment ({summary.awaiting_payment.count})
              </TabsTrigger>
              <TabsTrigger value="paid_ready_to_ship">
                Paid — Ready ({summary.paid_ready_to_ship.count})
              </TabsTrigger>
              <TabsTrigger value="shipped_unpaid">
                Shipped — Unpaid ({summary.shipped_unpaid.count})
              </TabsTrigger>
              <TabsTrigger value="shipped_and_paid">
                Shipped & Paid ({summary.shipped_and_paid.count})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-0">
              {filteredRows.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">
                  No shipments in this category.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company / Customer</TableHead>
                        <TableHead>Quotes</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Shipment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedRows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => router.push(`/opportunities/${row.id}`)}
                        >
                          <TableCell>
                            <div className="font-medium text-sm">{row.companyName}</div>
                            <div className="text-xs text-muted-foreground">{row.customerName}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {row.topic}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {row.quotations.map((q, i) => (
                                <button
                                  key={q.id}
                                  type="button"
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/shipping-calculator/preview?id=${q.id}`);
                                  }}
                                >
                                  {q.quotation_no || `Quote #${i + 1}`}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {formatThb(row.amountThb)}
                          </TableCell>
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                            className="align-middle"
                          >
                            <div className="flex items-center gap-1.5">
                              <DatePickerField
                                value={row.paymentDate || ''}
                                onChange={(date) => handlePaymentDateChange(row.id, date)}
                                disabled={savingPaymentId === row.id}
                                placeholder="Set paid date"
                                className={
                                  row.paymentDate
                                    ? 'inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline'
                                    : 'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                }
                              />
                              {savingPaymentId === row.id && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 shrink-0" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs ${
                                row.isShipped ? 'font-medium text-slate-800' : 'text-muted-foreground'
                              }`}
                            >
                              {row.shipmentLabel}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGE[row.opStatus]}>
                              {SHIPMENT_STATUS_LABELS[row.opStatus]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {filteredRows.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {rangeStart}–{rangeEnd} of {totalFiltered}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Per page</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(v) => setPageSize(Number(v))}
                      >
                        <SelectTrigger className="h-8 w-[72px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground px-2 whitespace-nowrap">
                        Page {safePage} of {totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
