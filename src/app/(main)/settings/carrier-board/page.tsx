'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { CarrierBoardRouteRow } from '@/types/carrier-board';

export default function CarrierBoardSettingsPage() {
  const [rows, setRows] = useState<CarrierBoardRouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('carrier_board_routes')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setRows((data ?? []) as CarrierBoardRouteRow[]);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : 'Failed to load carrier routes. Run DB migration if the table is missing.'
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoutes();
  }, [fetchRoutes]);

  const toggleActive = async (row: CarrierBoardRouteRow, nextActive: boolean) => {
    setUpdatingId(row.id);
    const prev = rows;
    setRows((r) =>
      r.map((x) => (x.id === row.id ? { ...x, is_active: nextActive } : x))
    );

    try {
      const { error } = await supabase
        .from('carrier_board_routes')
        .update({
          is_active: nextActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      if (error) throw error;
      toast.success(nextActive ? 'Route is now active on the marketing board' : 'Route marked as suspended');
    } catch (e) {
      setRows(prev);
      console.error(e);
      toast.error(
        e instanceof Error
          ? e.message
          : 'Could not update. Ensure you are logged in as staff or admin.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/admin/templates" className="gap-2 inline-flex items-center">
            <ArrowLeft className="h-4 w-4" />
            Document templates
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-2xl">Carrier board (marketing)</CardTitle>
          <CardDescription>
            Master routes for the &quot;Live Shipping Status&quot; widget on the public site. Toggle active or suspended
            without redeploying. Customers still see all rows; inactive routes show as &quot;Suspended&quot; on the board.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No routes found. Apply{' '}
              <code className="rounded bg-muted px-1 text-xs">migrations/create_carrier_board_routes.sql</code> in
              Supabase, then refresh.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium">Country</th>
                    <th className="p-3 font-medium">City</th>
                    <th className="p-3 font-medium">Carrier</th>
                    <th className="p-3 font-medium text-center">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3 tabular-nums text-muted-foreground">{r.sort_order}</td>
                      <td className="p-3 font-medium">{r.country}</td>
                      <td className="p-3 text-muted-foreground">{r.city}</td>
                      <td className="p-3 font-mono">{r.carrier_code}</td>
                      <td className="p-3">
                        <div className="flex justify-center items-center gap-2">
                          <Switch
                            checked={r.is_active}
                            disabled={updatingId === r.id}
                            onCheckedChange={(checked) => void toggleActive(r, checked)}
                          />
                          {updatingId === r.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50 flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
          <p className="text-sm text-gray-500">
            Only staff and admin profiles can change these rows (RLS).
          </p>
          <Button variant="outline" size="sm" onClick={() => void fetchRoutes()}>
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
