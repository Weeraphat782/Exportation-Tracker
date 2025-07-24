'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getFreightRates, deleteFreightRate as dbDeleteFreightRate, FreightRate as FreightRateType, Destination } from '@/lib/db'; // Import จาก db.ts

// Define the type explicitly including the nested destination object
type FreightRateWithDestination = FreightRateType & {
  destinations: Pick<Destination, 'country' | 'port'> | null; // Destination อาจจะเป็น null ถ้า join ไม่เจอ
};

export default function FreightRateSettingsPage() {
  const router = useRouter();
  const [freightRates, setFreightRates] = useState<FreightRateWithDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load freight rates from Database
  useEffect(() => {
    async function loadFreightRates() {
      setLoading(true);
      setError(null);
      try {
        const data = await getFreightRates();
        if (data) { // สมมติ getFreightRates คืน array เสมอ
          // Ensure data conforms to FreightRateWithDestination
          setFreightRates(data as FreightRateWithDestination[]);
        } else {
          setError("Failed to load freight rates. Please check console.");
          setFreightRates([]);
        }
      } catch {
        console.error('Error loading freight rates:');
        setError('An unexpected error occurred while loading freight rates.');
        setFreightRates([]);
      } finally {
        setLoading(false);
      }
    }
    loadFreightRates();
  }, []);

  // Handle edit button click
  const handleEdit = (id: string) => {
    router.push(`/settings/freight-rate/${id}`);
  };

  // Handle delete button click
  const handleDelete = async (id: string) => {
    const rateToDelete = freightRates.find(r => r.id === id);
    if (!rateToDelete) return;

    const isConfirmed = window.confirm(`คุณต้องการลบ Freight Rate สำหรับ ${rateToDelete.destinations?.country || 'Unknown Destination'} (ID: ${id}) ใช่หรือไม่?`);
    if (!isConfirmed) {
      return;
    }

    // Optimistically remove from UI
    setFreightRates(currentRates => currentRates.filter(rate => rate.id !== id));

    // Delete from database
    try {
      const success = await dbDeleteFreightRate(id);
      if (!success) {
        setError(`Failed to delete freight rate (ID: ${id})`);
        // Revert UI change if delete failed - fetch fresh data or revert based on original state if needed
        // For simplicity, just show error. A better revert might be needed.
        // Reverting optimistically requires storing original state or re-fetching.
        // Let's just keep the optimistic removal for now and rely on error message.
        // setFreightRates([...freightRates]); // Avoid using potentially stale state
      } else {
         console.log(`Deleted freight rate with ID: ${id}`);
         setError(null); // Clear previous errors on success
         // Optionally show a success message via toast
      }
    } catch (err: unknown) { // Use unknown for err type
      console.error('Error deleting freight rate:', err);
      setError('An unexpected error occurred while deleting the freight rate.');
      // Revert UI change on error - Again, reverting optimistic UI needs careful state handling
      // setFreightRates([...freightRates]); // Avoid stale state
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number, currencyCode: string = 'THB') => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: currencyCode }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Freight Rate Settings</h1>
          <p className="text-slate-500">Manage freight rates for different destinations</p>
        </div>
        <Link href="/settings/freight-rate/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Freight Rate
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Freight Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading freight rates...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Min Weight (kg)</TableHead>
                  <TableHead>Max Weight (kg)</TableHead>
                  <TableHead>Base Rate (THB)</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {freightRates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No freight rates found.</TableCell>
                  </TableRow>
                ) : (
                  freightRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.destinations?.country || 'N/A'}</TableCell>
                      <TableCell>{rate.destinations?.port || 'N/A'}</TableCell>
                      <TableCell>{rate.min_weight ?? '-'}</TableCell>
                      <TableCell>{rate.max_weight ?? '-'}</TableCell>
                      <TableCell>{formatCurrency(rate.base_rate)}</TableCell>
                      <TableCell>{rate.effective_date ? new Date(rate.effective_date).toLocaleDateString('th-TH') : '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="inline-flex items-center"
                          onClick={() => handleEdit(rate.id)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="inline-flex items-center text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(rate.id)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 