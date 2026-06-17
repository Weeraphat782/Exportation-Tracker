'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { createQcStandard } from '@/lib/qc-db';
import { EMPTY_CATALOG_SELECTIONS, hasCatalogSelections } from '@/lib/qc-catalog';
import type { QcCatalogSelections } from '@/lib/qc-catalog';
import { QcCatalogFields } from '@/components/qc/qc-catalog-fields';
import { toast } from 'sonner';

export default function NewQcStandardPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selections, setSelections] = useState<QcCatalogSelections>({ ...EMPTY_CATALOG_SELECTIONS });
  const [saving, setSaving] = useState(false);

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
    const created = await createQcStandard({
      name,
      description,
      selections,
    });
    setSaving(false);
    if (created) {
      toast.success('Standard created');
      router.push('/qc/standards');
    } else {
      toast.error('Failed to create standard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/qc/standards" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Standards
      </Link>

      <h1 className="text-2xl font-bold">New Test Standard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Standard details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. GACP" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional notes for lab staff"
            />
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
        Create Standard
      </Button>
    </div>
  );
}
