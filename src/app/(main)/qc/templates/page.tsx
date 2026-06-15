'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { deleteQcTemplate, getQcTemplates, updateQcTemplate } from '@/lib/qc-db';
import { toast } from 'sonner';
import type { QcTemplate } from '@/lib/qc-types';

export default function QcTemplatesPage() {
  const [templates, setTemplates] = useState<QcTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setTemplates(await getQcTemplates());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (tpl: QcTemplate) => {
    const ok = await updateQcTemplate(tpl.id, { is_active: !tpl.is_active });
    if (ok) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === tpl.id ? { ...t, is_active: !t.is_active } : t))
      );
    }
  };

  const handleDelete = async (id: string, tplName: string) => {
    if (!window.confirm(`Delete template "${tplName}"?`)) return;
    const ok = await deleteQcTemplate(id);
    if (ok) {
      toast.success('Deleted');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } else {
      toast.error('Delete failed — template may have requests');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">QC Templates</h1>
          <p className="text-slate-500">Manage test panels and pricing for QC requests</p>
        </div>
        <Link href="/qc/templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4 text-slate-500">Loading…</p>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No templates yet.</p>
              <Link href="/qc/templates/new">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Create your first template
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium">{tpl.name}</TableCell>
                    <TableCell className="text-slate-500">{tpl.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={tpl.is_active ? 'default' : 'secondary'}>
                        {tpl.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/qc/templates/${tpl.id}`}>
                        <Button size="sm" variant="outline">
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(tpl)}>
                        {tpl.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(tpl.id, tpl.name)}>
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
