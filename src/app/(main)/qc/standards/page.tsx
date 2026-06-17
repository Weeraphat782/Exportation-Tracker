'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { deleteQcStandard, getQcStandards, updateQcStandard } from '@/lib/qc-db';
import { toast } from 'sonner';
import type { QcTestStandard } from '@/lib/qc-types';

export default function QcStandardsPage() {
  const [standards, setStandards] = useState<QcTestStandard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setStandards(await getQcStandards());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (std: QcTestStandard) => {
    const ok = await updateQcStandard(std.id, { is_active: !std.is_active });
    if (ok) {
      setStandards((prev) =>
        prev.map((s) => (s.id === std.id ? { ...s, is_active: !s.is_active } : s))
      );
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete standard "${name}"?`)) return;
    const ok = await deleteQcStandard(id);
    if (ok) {
      toast.success('Deleted');
      setStandards((prev) => prev.filter((s) => s.id !== id));
    } else {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">QC Test Standards</h1>
          <p className="text-slate-500">Pre-fill FM-QC-019 test selections (e.g. GACP)</p>
        </div>
        <Link href="/qc/standards/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Standard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Standards</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4 text-slate-500">Loading…</p>
          ) : standards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No standards yet.</p>
              <Link href="/qc/standards/new">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Create your first standard
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standards.map((std) => (
                  <TableRow key={std.id}>
                    <TableCell className="font-medium">{std.name}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-slate-600">
                      {std.description || '—'}
                    </TableCell>
                    <TableCell>{std.selections.items.length}</TableCell>
                    <TableCell>
                      <Badge variant={std.is_active ? 'default' : 'secondary'}>
                        {std.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(std)}>
                        {std.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Link href={`/qc/standards/${std.id}`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(std.id, std.name)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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
