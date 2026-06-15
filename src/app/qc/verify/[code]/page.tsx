'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Loader2 } from 'lucide-react';
import { QC_LAB_LETTERHEAD } from '@/lib/qc-types';

interface VerifyData {
  qc_code: string;
  status: string;
  sample_name?: string;
  lot_no?: string;
  manufacturer?: string;
  template_name?: string;
  tests?: { name: string; qty: number; group_label?: string }[];
  created_at?: string;
}

export default function QcVerifyPage() {
  const params = useParams();
  const code = params.code as string;
  const [data, setData] = useState<VerifyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/qc/verify/${encodeURIComponent(code)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Not found');
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">{error || 'QC code not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <FlaskConical className="h-12 w-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold">{QC_LAB_LETTERHEAD.nameTh}</h1>
          <p className="text-sm text-slate-500">{QC_LAB_LETTERHEAD.formCode}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-center">{data.qc_code}</CardTitle>
            <div className="flex justify-center">
              <Badge variant={data.status === 'complete' ? 'default' : 'secondary'}>
                {data.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500">Template</span>
              <span>{data.template_name || '—'}</span>
              <span className="text-slate-500">Sample</span>
              <span>{data.sample_name || '—'}</span>
              <span className="text-slate-500">Lot No.</span>
              <span>{data.lot_no || '—'}</span>
              <span className="text-slate-500">Manufacturer</span>
              <span>{data.manufacturer || '—'}</span>
            </div>

            {data.tests && data.tests.length > 0 && (
              <div className="border-t pt-3">
                <p className="font-semibold mb-2">Tests</p>
                <ul className="space-y-1">
                  {data.tests.map((t, i) => (
                    <li key={i}>
                      {t.group_label ? `${t.group_label}: ` : ''}
                      {t.name} ({t.qty})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center pt-2">
              Verified via QR · {data.created_at ? new Date(data.created_at).toLocaleDateString() : ''}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
