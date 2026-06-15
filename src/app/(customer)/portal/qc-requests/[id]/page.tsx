'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, Loader2, Trash2, Upload } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { canDeleteQcRequest, deleteQcRequest, getQcRequestById, updateQcRequest } from '@/lib/qc-db';
import { QcInvoiceContent } from '@/components/qc/qc-invoice-content';
import { getFileUrl } from '@/lib/storage';
import { toast } from 'sonner';
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
  const qrRef = useRef<HTMLDivElement>(null);

  const scanUrl =
    typeof window !== 'undefined' && request
      ? `${window.location.origin}/qc/scan/${request.qc_code}`
      : '';

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getQcRequestById(id);
    if (data && user && data.customer_user_id !== user.id) {
      setRequest(null);
    } else {
      setRequest(data);
      if (data?.payment_slip_path) {
        setSlipUrl(await getFileUrl(data.payment_slip_path, 'r2'));
      }
      if (data?.coa_path) {
        setCoaUrl(await getFileUrl(data.coa_path, 'r2'));
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

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas || !request) return;
    const link = document.createElement('a');
    link.download = `${request.qc_code}-qr.png`;
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

        {/* RIGHT — upload slip (top) + QR (bottom) */}
        <div className="lg:col-span-1 order-1 lg:order-2 space-y-6 lg:sticky lg:top-6">
          {/* Payment slip */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Slip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.payment_slip_path && slipUrl ? (
                <div className="flex flex-wrap items-center gap-2">
                  <a href={slipUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View slip
                    </Button>
                  </a>
                  <label>
                    <Button asChild variant="ghost" size="sm" disabled={uploading}>
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-1" />
                        Replace
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
                <Badge variant="secondary">{request.payment_status}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* QR */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <div ref={qrRef} className="rounded-md border border-slate-200 p-3 bg-white">
                <QRCodeCanvas value={scanUrl} size={160} level="M" />
              </div>
              <p className="font-mono text-xs text-gray-500">{request.qc_code}</p>
              <p className="text-[11px] text-gray-400 text-center">
                Attach to the sample. Lab staff scan it to open this request; others see verification.
              </p>
              <Button variant="outline" className="w-full" onClick={downloadQr}>
                <Download className="h-4 w-4 mr-1" />
                Download QR
              </Button>
              <a href={scanUrl} target="_blank" rel="noreferrer" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open link
                </Button>
              </a>
              <p className="text-[11px] text-gray-400 text-center break-all">
                {scanUrl}
              </p>
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
