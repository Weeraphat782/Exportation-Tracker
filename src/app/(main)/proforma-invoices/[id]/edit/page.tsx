'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, ListPlus, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  computeProformaTotals,
  getProformaInvoiceById,
  getQuotationById,
  getQuotationLineOptions,
  type ProformaInvoice,
  type ProformaLineItem,
  type Quotation,
  updateProformaInvoice,
} from '@/lib/db';
import { toast } from 'sonner';
import { MobileMenuButton } from '@/components/ui/mobile-menu-button';

function toDateInput(v: string | null | undefined): string {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function isBlankPlaceholderRow(row: ProformaLineItem): boolean {
  return (
    (row.description ?? '').trim() === '' &&
    (Number(row.amount) || 0) === 0
  );
}

export default function EditProformaPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<Quotation | null>(null);

  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [freightType, setFreightType] = useState<string>('');
  const [estShippedDate, setEstShippedDate] = useState('');
  const [estGrossWeight, setEstGrossWeight] = useState('');
  const [estNetWeight, setEstNetWeight] = useState('');
  const [carrier, setCarrier] = useState('');
  const [mawb, setMawb] = useState('');
  const [qtyWt, setQtyWt] = useState('');
  const [chargeableWeight, setChargeableWeight] = useState('');
  const [airportDestination, setAirportDestination] = useState('');
  const [lineItems, setLineItems] = useState<ProformaLineItem[]>([{ description: '', amount: 0 }]);

  const [importOpen, setImportOpen] = useState(false);
  const [importSelected, setImportSelected] = useState<Record<string, boolean>>({});
  const [importMergeLines, setImportMergeLines] = useState(false);
  const [importMergedDescription, setImportMergedDescription] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const quoteOptions = useMemo(
    () => (quote ? getQuotationLineOptions(quote) : []),
    [quote]
  );

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProformaInvoiceById(id);
      if (!p) {
        toast.error('Proforma not found');
        router.push('/shipping-calculator');
        return;
      }
      const q = await getQuotationById(p.quotation_id);
      setQuote(q);

      setInvoiceNo(p.invoice_no || '');
      setInvoiceDate(toDateInput(p.invoice_date));
      setCustomerCode(p.customer_code || '');
      setCustomerName(p.customer_name || '');
      setCustomerAddress(p.customer_address || '');
      setConsigneeName(p.consignee_name || '');
      setConsigneeAddress(p.consignee_address || '');
      setFreightType(p.freight_type || '');
      setEstShippedDate(toDateInput(p.est_shipped_date));
      setEstGrossWeight(p.est_gross_weight != null ? String(p.est_gross_weight) : '');
      setEstNetWeight(p.est_net_weight != null ? String(p.est_net_weight) : '');
      setCarrier(p.carrier || '');
      setMawb(p.mawb || '');
      setQtyWt(p.qty_wt ?? '');
      setChargeableWeight(p.chargeable_weight != null ? String(p.chargeable_weight) : '');
      setAirportDestination(p.airport_destination || '');
      setLineItems(
        p.line_items?.length
          ? p.line_items.map((r) => ({
              description: r.description,
              amount: r.amount,
              taxable: r.taxable === false ? false : true,
            }))
          : [{ description: '', amount: 0, taxable: true }]
      );
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!importOpen || !importMergeLines) return;
    const picked = quoteOptions.filter((o) => importSelected[o.key]);
    setImportMergedDescription(picked.map((o) => o.description).join(' + '));
  }, [importOpen, importMergeLines, importSelected, quoteOptions]);

  const openImportFromQuotation = () => {
    if (!quoteOptions.length) {
      toast.error('No quotation lines to import', {
        description: 'This quotation has no freight, clearance, delivery, or additional charges.',
      });
      return;
    }
    const all: Record<string, boolean> = {};
    quoteOptions.forEach((o) => {
      all[o.key] = true;
    });
    setImportSelected(all);
    setImportMergeLines(false);
    setImportMergedDescription('');
    setImportMode('append');
    setImportOpen(true);
  };

  const handleImportConfirm = () => {
    const picked = quoteOptions.filter((o) => importSelected[o.key]);
    if (!picked.length) {
      toast.error('Select at least one line');
      return;
    }

    let newRows: ProformaLineItem[];
    if (importMergeLines) {
      const sum = roundMoney(picked.reduce((s, o) => s + o.amount, 0));
      const desc =
        importMergedDescription.trim() ||
        picked.map((o) => o.description).join(' + ');
      newRows = [{ description: desc, amount: sum, taxable: true }];
    } else {
      newRows = picked.map((o) => ({
        description: o.description,
        amount: o.amount,
        taxable: true,
      }));
    }

    if (importMode === 'replace') {
      setLineItems(
        newRows.length ? newRows : [{ description: '', amount: 0, taxable: true }]
      );
    } else {
      setLineItems((prev) => {
        let base = prev;
        if (base.length === 1 && isBlankPlaceholderRow(base[0])) {
          base = [];
        }
        return [...base, ...newRows];
      });
    }

    setImportOpen(false);
    toast.success('Line items imported');
  };

  const liveTotals = useMemo(() => computeProformaTotals(lineItems), [lineItems]);

  const handleLineChange = (
    index: number,
    field: keyof ProformaLineItem,
    value: string | number | boolean
  ) => {
    setLineItems((prev) => {
      const next = [...prev];
      const row = { ...next[index] };
      if (field === 'amount') {
        row.amount = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      } else if (field === 'taxable') {
        row.taxable = Boolean(value);
      } else {
        row.description = String(value);
      }
      next[index] = row;
      return next;
    });
  };

  const addRow = () =>
    setLineItems((prev) => [...prev, { description: '', amount: 0, taxable: true }]);
  const removeRow = (index: number) =>
    setLineItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const buildPatch = (): Partial<ProformaInvoice> => ({
    invoice_no: invoiceNo || null,
    invoice_date: invoiceDate || null,
    customer_code: customerCode || null,
    customer_name: customerName || null,
    customer_address: customerAddress || null,
    consignee_name: consigneeName || null,
    consignee_address: consigneeAddress || null,
    freight_type: (freightType === 'sea' || freightType === 'air' ? freightType : null) as
      | 'sea'
      | 'air'
      | null,
    est_shipped_date: estShippedDate || null,
    est_gross_weight: estGrossWeight === '' ? null : Number(estGrossWeight),
    est_net_weight: estNetWeight === '' ? null : Number(estNetWeight),
    carrier: carrier || null,
    mawb: mawb || null,
    qty_wt: qtyWt.trim() === '' ? null : qtyWt.trim(),
    chargeable_weight: chargeableWeight === '' ? null : Number(chargeableWeight),
    airport_destination: airportDestination || null,
    line_items: lineItems.map((r) => ({
      description: r.description,
      amount: Number(r.amount) || 0,
      taxable: r.taxable !== false,
    })),
  });

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateProformaInvoice(id, buildPatch());
      if (!updated) {
        toast.error('Save failed', {
          description:
            'Check the browser console for the exact reason (RLS, column type, etc.).',
        });
        return;
      }
      toast.success('Saved');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <Button variant="outline" size="icon" asChild>
            <Link href="/shipping-calculator">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Proforma Invoice</h1>
            {quote?.quotation_no && (
              <p className="text-sm text-muted-foreground">Quotation {quote.quotation_no}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/proforma-invoices/${id}/preview`}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_no">Invoice No.</Label>
          <Input
            id="invoice_no"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            placeholder="Manual entry"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice_date">Invoice date</Label>
          <Input
            id="invoice_date"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer_code">Customer code</Label>
          <Input
            id="customer_code"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Customer name</Label>
          <Input
            id="customer_name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customer_address">Customer address</Label>
          <Textarea
            id="customer_address"
            rows={3}
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="consignee_name">Consignee name</Label>
          <Input
            id="consignee_name"
            value={consigneeName}
            onChange={(e) => setConsigneeName(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="consignee_address">Consignee address</Label>
          <Textarea
            id="consignee_address"
            rows={3}
            value={consigneeAddress}
            onChange={(e) => setConsigneeAddress(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Freight type</Label>
          <Select value={freightType || '__empty'} onValueChange={(v) => setFreightType(v === '__empty' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty">—</SelectItem>
              <SelectItem value="sea">Sea</SelectItem>
              <SelectItem value="air">Air</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="est_shipped">Est. shipped date</Label>
          <Input
            id="est_shipped"
            type="date"
            value={estShippedDate}
            onChange={(e) => setEstShippedDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="est_gross">Est. gross weight (kg)</Label>
          <Input
            id="est_gross"
            type="number"
            step="any"
            value={estGrossWeight}
            onChange={(e) => setEstGrossWeight(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="est_net">Est. net weight (kg)</Label>
          <Input
            id="est_net"
            type="number"
            step="any"
            value={estNetWeight}
            onChange={(e) => setEstNetWeight(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="carrier">Carrier</Label>
          <Input id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mawb">MAWB</Label>
          <Input id="mawb" value={mawb} onChange={(e) => setMawb(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qty_wt">QTY / WT</Label>
          <Input
            id="qty_wt"
            type="text"
            placeholder="e.g. 2 plt / 145 kgs"
            value={qtyWt}
            onChange={(e) => setQtyWt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ch_wt">Chargeable weight (kg)</Label>
          <Input
            id="ch_wt"
            type="number"
            step="any"
            value={chargeableWeight}
            onChange={(e) => setChargeableWeight(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="airport">Airport / destination</Label>
          <Input
            id="airport"
            value={airportDestination}
            onChange={(e) => setAirportDestination(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">Line items</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openImportFromQuotation}
              disabled={!quote || quoteOptions.length === 0}
              title={
                !quote
                  ? 'Quotation not loaded'
                  : quoteOptions.length === 0
                    ? 'No charges on this quotation'
                    : 'Pick lines from the linked quotation'
              }
            >
              <ListPlus className="h-4 w-4 mr-1" />
              Import from quotation
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add row
            </Button>
          </div>
        </div>

        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import from quotation</DialogTitle>
              <DialogDescription>
                Choose which quotation charges to add. You can merge them into one line with a custom
                description, or append without replacing existing rows.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2 max-h-[40vh] overflow-y-auto rounded-md border p-3">
                {quoteOptions.map((opt) => (
                  <label
                    key={opt.key}
                    className="flex cursor-pointer items-start gap-3 rounded-md py-1.5 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={importSelected[opt.key] === true}
                      onCheckedChange={(v) =>
                        setImportSelected((prev) => ({
                          ...prev,
                          [opt.key]: v === true,
                        }))
                      }
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="font-medium leading-snug">{opt.description}</div>
                      <div className="text-muted-foreground">
                        {opt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Checkbox
                  id="import-merge"
                  checked={importMergeLines}
                  onCheckedChange={(v) => setImportMergeLines(v === true)}
                />
                <label htmlFor="import-merge" className="cursor-pointer text-sm font-medium">
                  Merge selected into one line
                </label>
              </div>

              {importMergeLines && (
                <div className="space-y-2">
                  <Label htmlFor="import-merged-desc">Merged description</Label>
                  <Textarea
                    id="import-merged-desc"
                    rows={2}
                    className="min-h-[64px] resize-y"
                    value={importMergedDescription}
                    onChange={(e) => setImportMergedDescription(e.target.value)}
                    placeholder="e.g. Freight + clearance"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">How to apply</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={importMode === 'append' ? 'default' : 'outline'}
                    onClick={() => setImportMode('append')}
                  >
                    Append to current lines
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={importMode === 'replace' ? 'default' : 'outline'}
                    onClick={() => setImportMode('replace')}
                  >
                    Replace all lines
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleImportConfirm}>
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="space-y-3">
          {lineItems.map((row, index) => {
            const isTaxable = row.taxable !== false;
            return (
              <div key={index} className="flex flex-col sm:flex-row gap-2 items-start">
                <div className="flex-1 w-full space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    rows={2}
                    className="min-h-[64px] resize-y"
                    value={row.description}
                    onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-36 space-y-1">
                  <Label className="text-xs text-muted-foreground">Amount (THB)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={Number.isFinite(row.amount) ? row.amount : ''}
                    onChange={(e) => handleLineChange(index, 'amount', e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-auto space-y-1">
                  <Label className="text-xs text-muted-foreground">VAT 7%</Label>
                  <label
                    className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background cursor-pointer select-none"
                    htmlFor={`taxable-${index}`}
                    title="Include this line in VAT 7% calculation"
                  >
                    <Checkbox
                      id={`taxable-${index}`}
                      checked={isTaxable}
                      onCheckedChange={(v) => handleLineChange(index, 'taxable', v === true)}
                    />
                    <span className="text-sm">Taxable</span>
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 mt-6 sm:mt-0"
                  onClick={() => removeRow(index)}
                  disabled={lineItems.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col items-end gap-1 text-sm border-t pt-4">
          <div>
            Subtotal:{' '}
            <strong>{liveTotals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> THB
          </div>
          <div>
            VAT 7%:{' '}
            <strong>{liveTotals.vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> THB
          </div>
          <div className="text-base font-bold">
            Grand total:{' '}
            {liveTotals.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB
          </div>
        </div>
      </div>
    </div>
  );
}
