'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, Loader2, Package, QrCode, Trash2, Upload, Wallet } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { canDeleteQcRequest, deleteQcRequest, getQcRequestById, updateQcRequest } from '@/lib/qc-db';
import { QcInvoiceContent } from '@/components/qc/qc-invoice-content';
import { getFileUrl } from '@/lib/storage';
import { toast } from 'sonner';
import {
  buildQcPaymentQrPayload,
  isQcPaymentSlipImage,
  QC_PAYMENT_STATUS_LABELS,
} from '@/lib/qc-types';
import type { QcRequest } from '@/lib/qc-types';

async function uploadQcFile(qcRequestId: string, file: File): Promise<string | null> {
  const generateUrlResponse = await fetch('/api/generate-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      qcRequestId,
      documentType: 'qc-payment-slip',
    }),
  });
  if (!generateUrlResponse.ok) return null;
  const { signedUrl, path } = await generateUrlResponse.json();
  const putRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putRes.ok) return null;
  return path as string;
}

function formatMoney(value: number | null | undefined) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PortalQcRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useCustomerAuth();
  const [request, setRequest] = useState<QcRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [coaUrl, setCoaUrl] = useState<string | null>(null);
  const sampleQrRef = useRef<HTMLDivElement>(null);
  const paymentQrRef = useRef<HTMLDivElement>(null);

  const scanUrl =
    typeof window !== 'undefined' && request
      ? `${window.location.origin}/qc/scan/${request.qc_code}`
      : '';

  const paymentQrPayload =
    request ? buildQcPaymentQrPayload(request.qc_code, request.grand_total) : '';

  const paymentMeta = request ? QC_PAYMENT_STATUS_LABELS[request.payment_status] : null;
  const slipIsImage = isQcPaymentSlipImage(request?.payment_slip_path);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getQcRequestById(id);
    if (data && user && data.customer_user_id !== user.id) {
      setRequest(null);
      setSlipUrl(null);
      setCoaUrl(null);
    } else {
      setRequest(data);
      if (data?.payment_slip_path) {
        setSlipUrl(await getFileUrl(data.payment_slip_path, 'r2'));
      } else {
        setSlipUrl(null);
      }
      if (data?.coa_path) {
        setCoaUrl(await getFileUrl(data.coa_path, 'r2'));
      } else {
        setCoaUrl(null);
      }
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const handleSlipUpload = async (file: File) => {
    setUploading(true);
    const path = await uploadQcFile(id, file);
    if (!path) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }
    const ok = await updateQcRequest(id, {
      payment_slip_path: path,
      payment_status: 'paid',
    });
    setUploading(false);
    if (ok) {
      toast.success('Payment slip uploaded');
      await load();
    } else {
      toast.error('Failed to save slip');
    }
  };

  const handleDelete = async () => {
    if (!request) return;
    if (!window.confirm(`Delete QC request ${request.qc_code}? This cannot be undone.`)) return;
    setDeleting(true);
    const ok = await deleteQcRequest(request.id);
    setDeleting(false);
    if (ok) {
      toast.success('QC request deleted');
      router.push('/portal/qc-requests');
    } else {
      toast.error('Failed to delete request');
    }
  };

  const downloadQr = (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    const canvas = ref.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!request) {
    return <p className="text-center py-8 text-red-500">Request not found</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/portal/qc-requests" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to QC Requests
      </Link>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-mono">{request.qc_code}</h1>
        {canDeleteQcRequest(request) && (
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1 text-red-500" />}
            Delete
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT — invoice */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <QcInvoiceContent request={request} />
        </div>

        {/* RIGHT — payment first, then sample QR */}
        <div className="lg:col-span-1 order-1 lg:order-2 space-y-6 lg:sticky lg:top-6">
          {/* Payment QR (Demo) */}
          <Card className="border-2 border-amber-300 bg-amber-50/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-amber-500 p-1.5">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-amber-900">QR สำหรับจ่ายเงิน</CardTitle>
                  <p className="text-xs text-amber-700">Payment QR</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Demo only</Badge>
              <div ref={paymentQrRef} className="rounded-md border-2 border-amber-300 p-3 bg-white">
                <QRCodeCanvas value={paymentQrPayload} size={160} level="M" fgColor="#b45309" />
              </div>
              <p className="text-sm font-semibold text-amber-900">
                {formatMoney(request.grand_total)} THB
              </p>
              <p className="text-[11px] text-amber-800 text-center leading-relaxed">
                Scan to pay (demo). After transferring, upload your payment slip below.
                The lab will not start testing until payment is verified.
              </p>
              <Button
                variant="outline"
                className="w-full border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => downloadQr(paymentQrRef, `${request.qc_code}-payment-qr.png`)}
              >
                <Download className="h-4 w-4 mr-1" />
                Download Payment QR
              </Button>
            </CardContent>
          </Card>

          {/* Payment slip */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Slip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMeta && (
                <div className="space-y-1">
                  <Badge className={paymentMeta.badgeClass}>{paymentMeta.label}</Badge>
                  <p className="text-xs text-slate-500">{paymentMeta.helper}</p>
                </div>
              )}

              {request.payment_slip_path && slipUrl ? (
                <div className="space-y-3">
                  {slipIsImage ? (
                    <a href={slipUrl} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slipUrl}
                        alt="Payment slip preview"
                        className="w-full rounded-md border border-slate-200 object-contain max-h-48 bg-slate-50"
                      />
                    </a>
                  ) : (
                    <a href={slipUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View slip (PDF)
                      </Button>
                    </a>
                  )}
                  <label>
                    <Button asChild variant="ghost" size="sm" disabled={uploading}>
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-1" />
                        Replace slip
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleSlipUpload(f);
                      }}
                    />
                  </label>
                </div>
              ) : (
                <label className="block">
                  <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={uploading}>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-1" />
                      Upload payment slip
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSlipUpload(f);
                    }}
                  />
                </label>
              )}
              {uploading && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge>{request.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Sample QR */}
          <Card className="border-2 border-emerald-300 bg-emerald-50/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-emerald-600 p-1.5">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-emerald-900">Sample QR</CardTitle>
                  <p className="text-xs text-emerald-700">แปะบนถุงตัวอย่าง</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                Attach to your sample
              </Badge>
              <div ref={sampleQrRef} className="rounded-md border-2 border-emerald-300 p-3 bg-white">
                <QRCodeCanvas value={scanUrl} size={160} level="M" fgColor="#047857" />
              </div>
              <p className="font-mono text-xs text-emerald-800">{request.qc_code}</p>
              <p className="text-[11px] text-emerald-700 text-center leading-relaxed">
                Print and attach to the sample bag. Lab staff scan this to open the request — not for payment.
              </p>
              <Button
                variant="outline"
                className="w-full border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                onClick={() => downloadQr(sampleQrRef, `${request.qc_code}-sample-qr.png`)}
              >
                <Download className="h-4 w-4 mr-1" />
                Download Sample QR
              </Button>
              <a href={scanUrl} target="_blank" rel="noreferrer" className="w-full">
                <Button variant="ghost" className="w-full text-emerald-800">
                  <QrCode className="h-4 w-4 mr-1" />
                  Open sample link
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* COA when complete */}
          {request.status === 'complete' && request.coa_path && coaUrl && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Certificate of Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <a href={coaUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Download COA
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
