'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getDestinations, deleteDestination as dbDeleteDestination, updateDestination, Destination as DestinationType } from '@/lib/db'; // Import updateDestination
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function DestinationSettingsPage() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<DestinationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load destinations from Database
  useEffect(() => {
    async function loadDestinations() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDestinations();
        // แก้ไขตามการคืนค่าของ getDestinations (array หรือ null)
        if (data) { // สมมติว่า getDestinations คืนค่า array เสมอ (อาจจะว่าง)
          setDestinations(data);
        } else {
           // กรณี getDestinations คืนค่า null เมื่อ error
           setError("Failed to load destinations. Please check console.");
           setDestinations([]); // แสดงตารางว่าง
        }
      } catch (err) {
        console.error('Error loading destinations:', err);
        setError('An unexpected error occurred while loading destinations.');
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    }
    loadDestinations();
  }, []);

  // Handle edit button click
  const handleEdit = (id: string) => {
    router.push(`/settings/destination/${id}`);
  };

  // Handle toggle active status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Optimistically update UI
    setDestinations(destinations.map(dest => 
      dest.id === id ? { ...dest, is_active: !currentStatus } : dest
    ));

    try {
      const updated = await updateDestination(id, { is_active: !currentStatus });
      if (!updated) {
        throw new Error("Failed to update status");
      }
      toast.success(`Destination ${!currentStatus ? 'activated' : 'disabled'} successfully`);
    } catch (err) {
      console.error('Error toggling destination status:', err);
      toast.error('Failed to update destination status');
      // Revert UI change on error
      const originalData = await getDestinations();
      setDestinations(originalData);
    }
  };

  // Handle delete button click
  const handleDelete = async (id: string) => {
    const destinationToDelete = destinations.find(d => d.id === id);
    if (!destinationToDelete) return;

    const isConfirmed = window.confirm(`คุณต้องการลบ ${destinationToDelete.country} (${destinationToDelete.port || 'N/A'}) ใช่หรือไม่?`);
    if (!isConfirmed) {
      return;
    }

    // Optimistically remove from UI
    setDestinations(destinations.filter(dest => dest.id !== id));

    // Delete from database
    try {
      const success = await dbDeleteDestination(id);
      if (!success) {
        setError(`Failed to delete destination: ${destinationToDelete.country}`);
        // Revert UI change if delete failed
        setDestinations([...destinations]); 
      } else {
         console.log(`Deleted destination with ID: ${id}`);
         toast.success('Destination deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting destination:', err);
      setError('An unexpected error occurred while deleting the destination.');
      // Revert UI change on error
      setDestinations([...destinations]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Destination Settings</h1>
          <p className="text-slate-500">Manage export destinations</p>
        </div>
        <Link href="/settings/destination/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Destination
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Destinations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading destinations...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinations.length === 0 ? (
                   <TableRow>
                    <TableCell colSpan={3} className="text-center">No destinations found.</TableCell>
                  </TableRow>
                ) : (
                  destinations.map((destination) => (
                    <TableRow key={destination.id}>
                      <TableCell className="font-medium">{destination.country}</TableCell>
                      <TableCell>{destination.port || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch 
                            checked={destination.is_active} 
                            onCheckedChange={() => handleToggleActive(destination.id, destination.is_active)}
                          />
                          {destination.is_active ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 gap-1">
                              <XCircle className="h-3 w-3" />
                              Disabled
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="inline-flex items-center"
                          onClick={() => handleEdit(destination.id)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="inline-flex items-center text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(destination.id)}
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