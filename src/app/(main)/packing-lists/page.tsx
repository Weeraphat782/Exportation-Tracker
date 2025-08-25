'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface PackingListItem {
  id: string;
  packing_list_no: string;
  consigner: string;
  consignee: string;
  port_loading?: string;
  port_destination?: string;
  status: 'draft' | 'completed' | 'archived';
  created_at: string;
}

export default function PackingListsPage() {
  const [items, setItems] = useState<PackingListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLists = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch('/api/packing-lists', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || 'โหลดรายการไม่สำเร็จ');
        return;
      }
      setItems(json.data || []);
    } catch (e) {
      console.error(e);
      toast.error('โหลดรายการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Packing Lists</h1>
          <p className="text-muted-foreground">All packing lists belonging to your account</p>
        </div>
        <Link href="/packing-list">
          <Button className="px-6">New Packing List</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All items</CardTitle>
          <CardDescription>Only your own data is shown (RLS)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">No items yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Number</th>
                    <th className="py-2 pr-4">Consigner</th>
                    <th className="py-2 pr-4">Consignee</th>
                    <th className="py-2 pr-4">Route</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b hover:bg-accent/30">
                      <td className="py-2 pr-4 font-medium">{it.packing_list_no}</td>
                      <td className="py-2 pr-4">{it.consigner}</td>
                      <td className="py-2 pr-4">{it.consignee}</td>
                      <td className="py-2 pr-4">{(it.port_loading || '-') + ' → ' + (it.port_destination || '-')}</td>
                      <td className="py-2 pr-4 capitalize">{it.status}</td>
                      <td className="py-2 pr-4">{new Date(it.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right space-x-2">
                        <Link href={`/packing-list?id=${it.id}`}>
                          <Button size="sm" variant="outline">Edit</Button>
                        </Link>
                        <button
                          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-red-50 border-red-200 text-red-700"
                          onClick={async () => {
                            try {
                              const { supabase } = await import('@/lib/supabase');
                              const { data: sessionData } = await supabase.auth.getSession();
                              const token = sessionData.session?.access_token;
                              const res = await fetch(`/api/packing-lists/${it.id}`, {
                                method: 'DELETE',
                                headers: token ? { Authorization: `Bearer ${token}` } : {}
                              });
                              const json = await res.json();
                              if (!json.success) {
                                toast.error(json.error || 'Delete failed');
                                return;
                              }
                              toast.success('Deleted');
                              loadLists();
                            } catch (e) {
                              console.error(e);
                              toast.error('Delete failed');
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


