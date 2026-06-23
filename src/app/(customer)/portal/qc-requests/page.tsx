'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FlaskConical, Plus, Eye, Trash2 } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { canDeleteQcRequest, deleteQcRequest, getCustomerQcRequests } from '@/lib/qc-db';
import { toast } from 'sonner';
import type { QcRequest } from '@/lib/qc-types';

export default function PortalQcRequestsPage() {
  const { user } = useCustomerAuth();
  const [requests, setRequests] = useState<QcRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getCustomerQcRequests(user.id).then((data) => {
      setRequests(data);
      setLoading(false);
    });
  }, [user]);

  const handleDelete = async (req: QcRequest) => {
    if (!window.confirm(`Delete QC request ${req.qc_code}? This cannot be undone.`)) return;
    setDeletingId(req.id);
    const ok = await deleteQcRequest(req.id);
    setDeletingId(null);
    if (ok) {
      toast.success('QC request deleted');
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } else {
      toast.error('Failed to delete request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-emerald-600" />
            QC Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">Submit lab testing requests and track results</p>
        </div>
        <Link href="/portal/qc-requests/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-1" />
            New QC Request
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-6 text-slate-500">Loading…</p>
          ) : requests.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 mb-4">No QC requests yet.</p>
              <Link href="/portal/qc-requests/new">
                <Button variant="outline">Create your first request</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QC Code</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Sample</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Est. COA</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono font-medium">{req.qc_code}</TableCell>
                    <TableCell>{req.qc_templates?.name || '—'}</TableCell>
                    <TableCell>{req.sample_name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={req.status === 'complete' ? 'default' : 'secondary'}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{req.payment_status}</TableCell>
                    <TableCell>
                      {req.estimated_coa_date ? (
                        <span className="font-medium text-emerald-700">
                          {new Date(req.estimated_coa_date).toLocaleDateString('en-GB')}
                        </span>
                      ) : (
                        <span className="text-amber-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/portal/qc-requests/${req.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {canDeleteQcRequest(req) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === req.id}
                          onClick={() => handleDelete(req)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
