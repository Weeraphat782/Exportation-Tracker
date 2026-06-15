'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FlaskConical, Layers, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import {
  createQcTemplate,
  getQcTemplateById,
  getQcTestItems,
  nestQcTestItems,
  saveQcTemplateGroups,
  updateQcTemplate,
  type QcGroupDraft,
  type QcItemDraft,
} from '@/lib/qc-db';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

function emptyItem(): QcItemDraft {
  return {
    key: crypto.randomUUID(),
    name: '',
    price: '',
    unit_label: '',
    test_duration: '',
  };
}

function emptyGroup(): QcGroupDraft {
  return {
    key: crypto.randomUUID(),
    name: '',
    min_sample_qty: '',
    unit_label: '',
    test_duration: '',
    price: '',
    items: [],
  };
}

function letter(index: number): string {
  return String.fromCharCode(65 + index);
}

function SubItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: QcItemDraft;
  index: number;
  onChange: (patch: Partial<QcItemDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      <div className="col-span-1 pb-2 text-sm font-semibold text-slate-500">{letter(index)}</div>
      <div className="col-span-4">
        <Label className="text-xs">Name *</Label>
        <Input value={item.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="e.g. Macroscopic" />
      </div>
      <div className="col-span-2">
        <Label className="text-xs">Price (THB)</Label>
        <Input type="number" value={item.price} onChange={(e) => onChange({ price: e.target.value })} />
      </div>
      <div className="col-span-2">
        <Label className="text-xs">Unit</Label>
        <Input value={item.unit_label} onChange={(e) => onChange({ unit_label: e.target.value })} />
      </div>
      <div className="col-span-2">
        <Label className="text-xs">Duration</Label>
        <Input value={item.test_duration} onChange={(e) => onChange({ test_duration: e.target.value })} />
      </div>
      <div className="col-span-1">
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  index,
  onChange,
  onRemove,
  onItemsChange,
}: {
  group: QcGroupDraft;
  index: number;
  onChange: (patch: Partial<QcGroupDraft>) => void;
  onRemove: () => void;
  onItemsChange: (items: QcItemDraft[], removedId?: string) => void;
}) {
  const hasItems = group.items.length > 0;

  const updateItem = (key: string, patch: Partial<QcItemDraft>) => {
    onItemsChange(group.items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const removeItem = (item: QcItemDraft) => {
    onItemsChange(
      group.items.filter((it) => it.key !== item.key),
      item.id
    );
  };

  const addItem = () => {
    onItemsChange([...group.items, emptyItem()]);
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Layers className="h-4 w-4 text-blue-600" />
          Group {index + 1}
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <Label>Group Name *</Label>
          <Input value={group.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="e.g. Identification" />
        </div>
        <div>
          <Label>Min Sample Qty</Label>
          <Input type="number" value={group.min_sample_qty} onChange={(e) => onChange({ min_sample_qty: e.target.value })} placeholder="e.g. 5" />
        </div>
        <div>
          <Label>Sample Unit</Label>
          <Input value={group.unit_label} onChange={(e) => onChange({ unit_label: e.target.value })} placeholder="e.g. g" />
        </div>
      </div>

      {!hasItems && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Price (single test, THB)</Label>
            <Input type="number" value={group.price} onChange={(e) => onChange({ price: e.target.value })} />
          </div>
          <div>
            <Label>Test Duration</Label>
            <Input value={group.test_duration} onChange={(e) => onChange({ test_duration: e.target.value })} placeholder="e.g. 5-7 days" />
          </div>
        </div>
      )}

      {hasItems && (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Sub-items</p>
          {group.items.map((item, idx) => (
            <SubItemRow
              key={item.key}
              item={item}
              index={idx}
              onChange={(patch) => updateItem(item.key, patch)}
              onRemove={() => removeItem(item)}
            />
          ))}
        </div>
      )}

      <Button type="button" size="sm" variant="outline" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" />
        Add Sub-item
      </Button>
      {!hasItems && (
        <p className="text-xs text-slate-400">
          Tip: add sub-items to make this a group (like A/B/C). Leave empty to keep it a single test with one price.
        </p>
      )}
    </div>
  );
}

export function QcTemplateForm({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const isEdit = !!templateId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groups, setGroups] = useState<QcGroupDraft[]>([emptyGroup()]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    const [tpl, rawItems] = await Promise.all([
      getQcTemplateById(templateId),
      getQcTestItems(templateId),
    ]);
    if (!tpl) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setName(tpl.name);
    setDescription(tpl.description || '');
    const nested = nestQcTestItems(rawItems);
    setGroups(
      nested.length === 0
        ? [emptyGroup()]
        : nested.map((node) => ({
            key: node.id,
            id: node.id,
            name: node.name,
            min_sample_qty: node.min_sample_qty != null ? String(node.min_sample_qty) : '',
            unit_label: node.unit_label || '',
            test_duration: node.test_duration || '',
            price: node.price != null ? String(node.price) : '',
            items: (node.children || []).map((c) => ({
              key: c.id,
              id: c.id,
              name: c.name,
              price: c.price != null ? String(c.price) : '',
              unit_label: c.unit_label || '',
              test_duration: c.test_duration || '',
            })),
          }))
    );
    setRemovedIds([]);
    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateGroup = (key: string, patch: Partial<QcGroupDraft>) => {
    setGroups((prev) => prev.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  };

  const setGroupItems = (key: string, items: QcItemDraft[], removedId?: string) => {
    if (removedId) setRemovedIds((prev) => [...prev, removedId]);
    setGroups((prev) => prev.map((g) => (g.key === key ? { ...g, items } : g)));
  };

  const removeGroup = (group: QcGroupDraft) => {
    const ids = [group.id, ...group.items.map((i) => i.id)].filter(Boolean) as string[];
    if (ids.length) setRemovedIds((prev) => [...prev, ...ids]);
    setGroups((prev) => prev.filter((g) => g.key !== group.key));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const activeGroups = groups.filter((g) => g.name.trim());
    if (activeGroups.length === 0) {
      toast.error('Add at least one group or test');
      return;
    }
    if (activeGroups.some((g) => g.items.some((i) => !i.name.trim()))) {
      toast.error('Every sub-item needs a name');
      return;
    }

    setSaving(true);

    let id = templateId;
    if (!isEdit) {
      const { data: { user } } = await supabase.auth.getUser();
      const created = await createQcTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        created_by: user?.id,
      });
      if (!created) {
        toast.error('Failed to create template');
        setSaving(false);
        return;
      }
      id = created.id;
    } else {
      await updateQcTemplate(templateId!, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
    }

    const result = await saveQcTemplateGroups(id!, activeGroups, removedIds);
    setSaving(false);

    if (result.ok) {
      toast.success(isEdit ? 'Template saved' : 'Template created');
      router.push('/qc/templates');
    } else if (!isEdit) {
      toast.error(`Template created but ${result.failed} item(s) failed`);
      router.push(`/qc/templates/${id}`);
    } else {
      toast.error(`${result.failed} item(s) failed to save`);
      await load();
    }
  };

  if (loading) {
    return <p className="text-center py-8 text-slate-500">Loading…</p>;
  }

  if (notFound) {
    return <p className="text-center py-8 text-red-500">Template not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/qc/templates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit QC Template' : 'New QC Template'}</h1>
          <p className="text-slate-500">Set name and grouped test items in one step</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-600" />
            <CardTitle>Template Details</CardTitle>
          </div>
          <CardDescription>Name and describe the test panel customers will select.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-w-2xl">
          <div>
            <Label>Template Name *</Label>
            <Input placeholder="e.g. Cannabis Full Panel" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Input placeholder="Optional description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Groups & Tests</CardTitle>
            <CardDescription>
              A group (e.g. &quot;Identification&quot;) can hold sub-items A/B/C, each with its own price.
            </CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setGroups((prev) => [...prev, emptyGroup()])}>
            <Plus className="h-4 w-4 mr-1" />
            Add Group
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.map((group, index) => (
            <GroupCard
              key={group.key}
              group={group}
              index={index}
              onChange={(patch) => updateGroup(group.key, patch)}
              onRemove={() => removeGroup(group)}
              onItemsChange={(items, removedId) => setGroupItems(group.key, items, removedId)}
            />
          ))}
          {groups.length === 0 && (
            <p className="text-center text-slate-500 py-4">No groups yet. Add one above.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          {isEdit ? 'Save Template' : 'Create Template'}
        </Button>
        <Link href="/qc/templates">
          <Button variant="outline" disabled={saving}>
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  );
}
