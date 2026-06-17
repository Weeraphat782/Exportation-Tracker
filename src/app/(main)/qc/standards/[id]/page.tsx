'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { getQcStandardById, updateQcStandard } from '@/lib/qc-db';
import { EMPTY_CATALOG_SELECTIONS, hasCatalogSelections } from '@/lib/qc-catalog';
import type { QcCatalogSelections } from '@/lib/qc-catalog';
import { QcCatalogFields } from '@/components/qc/qc-catalog-fields';
import { toast } from 'sonner';

export default function EditQcStandardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selections, setSelections] = useState<QcCatalogSelections>({ ...EMPTY_CATALOG_SELECTIONS });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getQcStandardById(id).then((std) => {
      if (!std) {
        setLoading(false);
        return;
      }
      setName(std.name);
      setDescription(std.description || '');
      setSelections({
        items: [...std.selections.items],
        units: { ...(std.selections.units || {}) },
        potencyOther: std.selections.potencyOther,
        heavyMetalsOther: std.selections.heavyMetalsOther,
        other: std.selections.other,
      });
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!hasCatalogSelections(selections)) {
      toast.error('Select at least one test item');
      return;
    }
    setSaving(true);
    const ok = await updateQcStandard(id, {
      name,
      description,
      selections,
    });
    setSaving(false);
    if (ok) {
      toast.success('Standard updated');
      router.push('/qc/standards');
    } else {
      toast.error('Failed to update standard');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/qc/standards" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Standards
      </Link>

      <h1 className="text-2xl font-bold">Edit Test Standard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Standard details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pre-selected tests (FM-QC-019)</CardTitle>
        </CardHeader>
        <CardContent>
          <QcCatalogFields value={selections} onChange={setSelections} />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
        Save Standard
      </Button>
    </div>
  );
}
