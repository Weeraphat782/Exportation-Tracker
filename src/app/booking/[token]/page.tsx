'use client';

import { use, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plane,
  Package,
  MapPin,
  Loader2,
  FileText,
  Download,
  AlertTriangle,
  ChevronDown,
  Calendar,
  User,
  Route,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EmailBookingData } from '@/lib/email-templates';
import type { Pallet } from '@/lib/db';
import JSZip from 'jszip';
import { toast } from 'sonner';

interface BookingDocument {
  id: string;
  file_name: string;
  original_file_name?: string;
  document_type?: string;
  document_type_name?: string;
  file_url: string;
  mime_type?: string;
  submitted_at?: string;
}

interface BookingQuotation {
  id: string;
  quotation_no?: string | null;
  company_name?: string | null;
  customer_name?: string | null;
  contact_person?: string | null;
  destination?: string | null;
  commodity_type?: string | null;
  pallets?: Pallet[];
  total_actual_weight?: number | null;
  total_volume_weight?: number | null;
  chargeable_weight?: number | null;
  booking_details?: EmailBookingData | Record<string, unknown> | null;
}

interface BookingPayload {
  quotation: BookingQuotation;
  documents: BookingDocument[];
  staff_files: {
    awb_url?: string | null;
    awb_file_name?: string | null;
    customs_url?: string | null;
    customs_file_name?: string | null;
  };
}

function commodityLabel(t?: string | null) {
  if (!t) return 'General';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function displayVal(value?: string | number | null) {
  if (value == null || String(value).trim() === '') return '—';
  return String(value);
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function DefItem({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex gap-3 py-3 border-b border-slate-100 last:border-0">
      {Icon && (
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900 mt-0.5 break-words">{displayVal(value)}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
  collapsible,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const titleContent = (
    <>
      <Icon className="w-4 h-4 text-[#215497] shrink-0" />
      <span>{title}</span>
      {collapsible && (
        <ChevronDown
          className={`w-4 h-4 text-slate-500 ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
        />
      )}
    </>
  );

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/80">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 items-center gap-2 text-sm font-bold text-slate-800 text-left min-w-0"
            aria-expanded={open}
          >
            {titleContent}
          </button>
        ) : (
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 min-w-0">
            {titleContent}
          </h2>
        )}
        {action}
      </div>
      {(!collapsible || open) && <div className="p-5">{children}</div>}
    </section>
  );
}

export default function PublicBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [payload, setPayload] = useState<BookingPayload | null>(null);
  const [zipLoading, setZipLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/booking/${encodeURIComponent(token)}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      setPayload((await res.json()) as BookingPayload);
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const q = payload?.quotation;
  const details = (q?.booking_details || {}) as EmailBookingData;

  const palletRows = useMemo(() => {
    const pallets = q?.pallets || [];
    return pallets.map((p, i) => ({
      index: i + 1,
      dims: `${p.length} × ${p.width} × ${p.height}`,
      weight: Number(p.weight) || 0,
      qty: Number(p.quantity) || 1,
    }));
  }, [q?.pallets]);

  const hasDocuments = useMemo(() => {
    if (!payload) return false;
    return (
      payload.documents.length > 0 ||
      !!payload.staff_files.awb_url ||
      !!payload.staff_files.customs_url
    );
  }, [payload]);

  const handleDownloadAll = async () => {
    const docs = payload?.documents?.filter((d) => d.file_url) || [];
    const extras: { name: string; url: string }[] = [];
    if (payload?.staff_files.awb_url) {
      extras.push({
        name: payload.staff_files.awb_file_name || 'awb.pdf',
        url: payload.staff_files.awb_url,
      });
    }
    if (payload?.staff_files.customs_url) {
      extras.push({
        name: payload.staff_files.customs_file_name || 'customs.pdf',
        url: payload.staff_files.customs_url,
      });
    }
    const all = [
      ...docs.map((d) => ({
        name: d.original_file_name || d.file_name || `doc-${d.id}`,
        url: d.file_url,
      })),
      ...extras,
    ];
    if (all.length === 0) {
      toast.error('No documents to download');
      return;
    }
    setZipLoading(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        all.map(async (item, i) => {
          try {
            const res = await fetch(item.url);
            if (!res.ok) return;
            const blob = await res.blob();
            const safeName = item.name.replace(/[/\\?%*:|"<>]/g, '_') || `file-${i}`;
            zip.file(safeName, blob);
          } catch {
            /* skip */
          }
        })
      );
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking_${q?.quotation_no || token.slice(0, 8)}_documents.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ZIP downloaded');
    } catch {
      toast.error('Failed to create ZIP');
    } finally {
      setZipLoading(false);
    }
  };

  const netWeight =
    details.netWeight != null
      ? `${details.netWeight} kg`
      : q?.total_actual_weight
        ? `${q.total_actual_weight} kg`
        : '—';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#215497]" />
        </div>
        <p className="text-sm font-medium text-slate-600">Loading booking sheet…</p>
      </div>
    );
  }

  if (notFound || !payload || !q) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 shadow-lg p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Booking link not found</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            This link is invalid or has expired. Contact the sender for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-20 shadow-md"
        style={{ background: 'linear-gradient(135deg, #215497 0%, #2c6bb8 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="min-w-0 text-white">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/15 text-[10px] font-bold uppercase tracking-widest mb-3">
              <Plane className="w-3.5 h-3.5" />
              Air Freight Booking
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {q.quotation_no || q.id.slice(0, 8)}
            </h1>
            <p className="text-blue-100/90 font-medium mt-1 truncate">{q.company_name}</p>
            {q.destination && (
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/15 text-sm font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {q.destination}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-12">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Net weight" value={netWeight} />
          <StatTile
            label="Chargeable"
            value={q.chargeable_weight ? `${q.chargeable_weight} kg` : '—'}
          />
          <StatTile
            label="Volume weight"
            value={
              q.total_volume_weight
                ? `${Math.ceil(Number(q.total_volume_weight))} kg`
                : '—'
            }
          />
          <StatTile
            label="Commodity"
            value={commodityLabel(q.commodity_type)}
            sub={details.numberOfPieces || undefined}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Shipment + collapsible Pallets + Documents */}
          <div className="space-y-6">
            <SectionCard title="Shipment" icon={MapPin}>
              <DefItem label="Shipper" value={q.company_name} icon={User} />
              <DefItem
                label="Contact"
                value={q.contact_person || q.customer_name}
                icon={User}
              />
              <DefItem label="Destination" value={q.destination} icon={MapPin} />
            </SectionCard>

            {palletRows.length > 0 && (
              <SectionCard
                title={`Pallets (${palletRows.length})`}
                icon={Package}
                collapsible
                defaultOpen={false}
              >
                <div className="overflow-x-auto -mx-1 rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Dimensions (cm)</th>
                        <th className="px-4 py-3">Weight</th>
                        <th className="px-4 py-3">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {palletRows.map((row, i) => (
                        <tr
                          key={row.index}
                          className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                        >
                          <td className="px-4 py-3 font-medium text-slate-700">{row.index}</td>
                          <td className="px-4 py-3 tabular-nums">{row.dims}</td>
                          <td className="px-4 py-3 tabular-nums">{row.weight} kg</td>
                          <td className="px-4 py-3 tabular-nums">{row.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* Documents — ZIP only */}
            <SectionCard title="Documents" icon={FileText}>
              {!hasDocuments ? (
                <p className="text-sm text-slate-500 text-center py-6">No documents uploaded yet.</p>
              ) : (
                <Button
                  type="button"
                  className="w-full bg-[#215497] hover:bg-[#1a4378] text-white"
                  onClick={handleDownloadAll}
                  disabled={zipLoading}
                >
                  {zipLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download all (ZIP)
                </Button>
              )}
            </SectionCard>
          </div>

          {/* Right: Booking request */}
          <div className="space-y-6">
            <SectionCard title="Booking request" icon={Plane}>
              <DefItem label="Product" value={details.product} />
              <DefItem label="Airline" value={details.airline} />
              <DefItem
                label="Preferred shipment date"
                value={details.preferredShipmentDate}
                icon={Calendar}
              />
              <DefItem label="Pick-up" value={details.pickupLocation} />
              <DefItem label="Origin" value={details.origin} />
              <DefItem label="Consignee" value={details.consignee} icon={User} />
              <DefItem label="Routing" value={details.routing} icon={Route} />
              <DefItem label="Pieces" value={details.numberOfPieces} icon={Package} />
              <DefItem label="Pallet dimensions" value={details.palletDimensions} />
              <DefItem label="MAWB (requested)" value={details.mawb} />
            </SectionCard>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-200/60 bg-white/50">
        OMG Experience — Air Freight Booking
      </footer>
    </div>
  );
}
