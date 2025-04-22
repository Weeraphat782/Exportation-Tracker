'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getFreightRateById, updateFreightRate, getDestinations, Destination } from '@/lib/db';

// ใช้ Schema เดิมจากหน้า New
const freightRateFormSchema = z.object({
  destination_id: z.string().uuid({ message: 'Please select a destination' }),
  min_weight: z.coerce.number().positive().optional().nullable(),
  max_weight: z.coerce.number().positive().optional().nullable(),
  base_rate: z.coerce.number().positive({ message: 'Base rate must be positive' }),
  effective_date: z.string().optional().nullable(),
}).refine(data => {
  // Handle potential null/undefined values
  const minW = data.min_weight ?? -Infinity;
  const maxW = data.max_weight ?? Infinity;
  return minW <= maxW;
}, {
  message: "Max weight must be greater than or equal to min weight",
  path: ["max_weight"],
});

type FreightRateFormValues = z.infer<typeof freightRateFormSchema>;

export default function EditFreightRatePage() {
  const router = useRouter();
  const params = useParams();
  const rateId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state for rate data
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<Pick<Destination, 'id' | 'country' | 'port'>[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  const form = useForm<FreightRateFormValues>({
    resolver: zodResolver(freightRateFormSchema),
    defaultValues: { // ค่าเริ่มต้นว่าง รอโหลดข้อมูล
      destination_id: undefined,
      min_weight: null,
      max_weight: null,
      base_rate: undefined,
      effective_date: null,
    },
  });

  // Load destinations for dropdown
  useEffect(() => {
    async function loadDestinations() {
      setLoadingDestinations(true);
      try {
        const data = await getDestinations();
        setDestinations(data || []);
      } catch (err) {
        console.error("Error loading destinations:", err);
        // Don't block the form if destinations fail to load, maybe show a message
      } finally {
        setLoadingDestinations(false);
      }
    }
    loadDestinations();
  }, []);

  // Load freight rate data to edit
  useEffect(() => {
    async function loadRate() {
      if (!rateId) {
        setError("Invalid freight rate ID.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const rateData = await getFreightRateById(rateId);
        if (rateData) {
          form.reset({
            destination_id: rateData.destination_id,
            min_weight: rateData.min_weight,
            max_weight: rateData.max_weight,
            base_rate: rateData.base_rate,
            effective_date: rateData.effective_date, // Ensure format matches (YYYY-MM-DD for type="date")
          });
        } else {
          setError(`Freight rate with ID ${rateId} not found.`);
        }
      } catch (err) {
        console.error('Error loading freight rate:', err);
        setError('An unexpected error occurred while loading freight rate details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadRate();
  }, [rateId, form]);

  const onSubmit = async (data: FreightRateFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!rateId) {
        throw new Error("Invalid freight rate ID.");
      }

      // Prepare data for update (Partial<Omit<FreightRate,...>>)
      const updates = {
         destination_id: data.destination_id,
         min_weight: data.min_weight,
         max_weight: data.max_weight,
         base_rate: data.base_rate,
         effective_date: data.effective_date || null,
      };

      // Remove unused @ts-expect-error
      const updatedRate = await updateFreightRate(rateId, updates);

      if (updatedRate) {
        console.log('Updated freight rate in DB:', updatedRate);
        router.push('/settings/freight-rate');
      } else {
        throw new Error('Failed to update freight rate in database.');
      }

    } catch (err: unknown) {
      console.error('Error updating freight rate:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
     return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Loading freight rate data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/freight-rate">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Freight Rate</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Freight Rate Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && !isLoading && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
              <p>Error: {error}</p>
              <Link href="/settings/freight-rate">
                 <Button variant="link" className="text-red-700 underline">Go back to list</Button>
              </Link>
            </div>
          )}
          {!error && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="destination_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value} // Use value here for controlled component
                        disabled={loadingDestinations}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingDestinations ? "Loading..." : "Select a destination"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {destinations.map((dest) => (
                            <SelectItem key={dest.id} value={dest.id}>
                              {dest.country}{dest.port ? ` (${dest.port})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                      control={form.control}
                      name="min_weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Optional" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="max_weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Optional" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="base_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate (THB per kg) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="Enter base rate" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="effective_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective Date</FormLabel>
                          <FormControl>
                            <Input type="date" placeholder="Optional" {...field} value={field.value ?? ''} />
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
                  <Link href="/settings/freight-rate">
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting || isLoading || loadingDestinations || !!error}>
                    {isSubmitting ? 'Saving...' : 'Update Freight Rate'}
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