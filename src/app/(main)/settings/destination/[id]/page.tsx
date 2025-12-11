'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, Form, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getDestinationById, updateDestination /*, Destination */ } from '@/lib/db'; // Import db functions

// ใช้ Schema เดียวกับหน้า New ที่แก้ไขแล้ว
const destinationFormSchema = z.object({
  country: z.string().min(1, { message: 'Country name is required' }),
  port: z.string().optional(),
});

type DestinationFormValues = z.infer<typeof destinationFormSchema>;

export default function EditDestinationPage() {
  const router = useRouter();
  const params = useParams();
  const destinationId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationFormSchema),
    defaultValues: { // ค่าเริ่มต้นว่าง รอโหลดข้อมูล
      country: '',
      port: '',
    },
  });

  // Load destination data
  useEffect(() => {
    async function loadDestination() {
      if (!destinationId) {
        setError("Invalid destination ID.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const destination = await getDestinationById(destinationId);
        
        if (destination) {
          form.reset({
            country: destination.country || '',
            port: destination.port || '',
          });
        } else {
          setError(`Destination with ID ${destinationId} not found.`);
        }
      } catch (err) {
        console.error('Error loading destination:', err);
        setError('An unexpected error occurred while loading destination details.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDestination();
  }, [destinationId, form]); // Dependencies

  const onSubmit = async (data: DestinationFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!destinationId) {
        throw new Error("Invalid destination ID.");
      }

      // updateDestination รับ Partial<Pick<...>> ซึ่ง data ตรง type พอดี
      const updatedDestination = await updateDestination(destinationId, data);
      
      if (updatedDestination) {
        console.log('Updated destination in DB:', updatedDestination);
        router.push('/settings/destination');
      } else {
        throw new Error('Failed to update destination in database.');
      }

    } catch (err: unknown) {
      console.error('Error updating destination:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Loading destination data...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/destination">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Destination</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Destination Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && !isLoading && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
              <p>Error: {error}</p>
              <Link href="/settings/destination">
                 <Button variant="link" className="text-red-700 underline">Go back to list</Button>
              </Link>
            </div>
          )}
          {!error && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter country name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter port name (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-red-500 mt-4">Error: {error}</p>
                )}

                <div className="flex justify-end space-x-4">
                  <Link href="/settings/destination">
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting || isLoading || !!error}>
                    {isSubmitting ? 'Saving...' : 'Update Destination'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 