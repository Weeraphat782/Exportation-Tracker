'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, CheckCircle, ExternalLink, FileText, Loader2, PlayCircle, Upload } from 'lucide-react';
import { getQcRequestById, updateQcRequest } from '@/lib/qc-db';
import { QcInvoiceContent } from '@/components/qc/qc-invoice-content';
import { QcRequestPrintForm } from '@/components/qc/qc-request-print-form';
import { getFileUrl } from '@/lib/storage';
import { toast } from 'sonner';
import type { QcRequest } from '@/lib/qc-types';

async function uploadQcFile(qcRequestId: string, file: File, documentType: string): Promise<string | null> {
  const generateUrlResponse = await fetch('/api/generate-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      qcRequestId,
      documentType,
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

export default function LabQcRequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [request, setRequest] = useState<QcRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [labNotes, setLabNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [coaUrl, setCoaUrl] = useState<string | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getQcRequestById(id);
    setRequest(data);
    if (data) {
      setLabNotes(data.lab_notes || '');
      if (data.payment_slip_path) {
        setSlipUrl(await getFileUrl(data.payment_slip_path, 'r2'));
      }
      if (data.coa_path) {
        setCoaUrl(await getFileUrl(data.coa_path, 'r2'));
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (patchData: Partial<QcRequest>) => {
    setBusy(true);
    const ok = await updateQcRequest(id, patchData);
    setBusy(false);
    if (ok) {
      toast.success('Updated');
      await load();
    } else {
      toast.error('Update failed');
    }
  };

  const verifyPayment = async () => {
    await patch({ payment_status: 'verified', status: 'processing' });
  };

  const moveToProcessing = async () => {
    await patch({ status: 'processing' });
  };

  const markComplete = async () => {
    await patch({ status: 'complete', lab_notes: labNotes });
  };

  const handleCoaUpload = async (file: File) => {
    setBusy(true);
    const path = await uploadQcFile(id, file, 'qc-coa');
    if (!path) {
      toast.error('Upload failed');
      setBusy(false);
      return;
    }
    await patch({ coa_path: path });
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!request) {
    return <p className="text-center py-8 text-red-500">Request not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 print:hidden">
        <Link href="/qc/requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Queue
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-mono">{request.qc_code}</h1>
          <div className="flex gap-2 mt-1">
            <Badge>{request.status}</Badge>
            <Badge variant="secondary">{request.payment_status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* LEFT — QC Request form */}
        <div className="lg:col-span-2 print:w-full">
          <QcRequestPrintForm request={request} />
        </div>

        {/* RIGHT — Lab actions */}
        <Card className="lg:col-span-1 print:hidden lg:sticky lg:top-6 self-start">
          <CardHeader>
            <CardTitle>Lab Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Status */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              {request.status === 'new' && (
                <Button className="w-full" onClick={moveToProcessing} disabled={busy}>
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Move to Processing
                </Button>
              )}
              {request.status === 'processing' && (
                <p className="text-sm text-slate-500">Currently in processing.</p>
              )}
              {request.status === 'complete' && (
                <p className="text-sm text-emerald-600">Completed.</p>
              )}
            </div>

            {/* Payment */}
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment</p>
              {request.payment_slip_path ? (
                <>
                  {slipUrl && (
                    <a href={slipUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View payment slip
                      </Button>
                    </a>
                  )}
                  {request.payment_status !== 'verified' && (
                    <Button className="w-full" onClick={verifyPayment} disabled={busy}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify Payment
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No payment slip uploaded yet.</p>
              )}
            </div>

            {/* Documents */}
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Documents</p>
              <Button variant="outline" className="w-full" onClick={() => setInvoiceOpen(true)}>
                <FileText className="h-4 w-4 mr-1" />
                View Invoice
              </Button>
              {coaUrl && (
                <a href={coaUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View COA
                  </Button>
                </a>
              )}
              <label className="block">
                <Button asChild variant="outline" className="w-full border-dashed">
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-1" />
                    {request.coa_path ? 'Replace COA' : 'Upload COA'}
                  </span>
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCoaUpload(f);
                  }}
                />
              </label>
            </div>

            {/* Lab notes */}
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lab Notes</p>
              <Textarea value={labNotes} onChange={(e) => setLabNotes(e.target.value)} rows={4} />
            </div>

            {/* Complete */}
            {request.status !== 'complete' && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={markComplete} disabled={busy}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>QC Invoice — {request.qc_code}</DialogTitle>
          </DialogHeader>
          <QcInvoiceContent request={request} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
