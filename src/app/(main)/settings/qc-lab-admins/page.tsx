'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCog, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { QcLabAdminAllowlistEntry } from '@/lib/qc-types';

export default function QcLabAdminsPage() {
  const [entries, setEntries] = useState<QcLabAdminAllowlistEntry[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/qc/allowlist', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const body = await res.json();
      setEntries(body.entries || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/qc/allowlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      toast.success('Email added');
      setEmail('');
      await load();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error || 'Failed to add email');
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/qc/allowlist', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ id, is_active }),
    });
    if (res.ok) {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, is_active } : e)));
    } else {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this email from allowlist?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/qc/allowlist?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success('Removed');
    } else {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QC Lab Admins</h1>
        <p className="text-slate-500">Manage Google sign-in allowlist for Lab Admin users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-blue-600" />
            <CardTitle>Add Lab Admin Email</CardTitle>
          </div>
          <CardDescription>Only emails on this list can sign in as Lab Admin via Google.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-lg">
            <Input
              type="email"
              placeholder="lab.admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleAdd} disabled={saving}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allowlist</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4 text-slate-500">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-center py-4 text-slate-500">No emails yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell>
                      <Badge variant={entry.is_active ? 'default' : 'secondary'}>
                        {entry.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(entry.id, !entry.is_active)}
                      >
                        {entry.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(entry.id)}>
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
