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
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createFreightRate, getDestinations, Destination } from '@/lib/db';
import { toast } from "sonner";

// Schema สำหรับ Freight Rate form (ไม่มี currency)
const freightRateFormSchema = z.object({
  destination_id: z.string().uuid({ message: 'Please select a destination' }),
  min_weight: z.coerce.number().positive().optional().nullable(),
  max_weight: z.coerce.number().positive().optional().nullable(),
  base_rate: z.coerce.number().positive({ message: 'Base rate must be positive' }),
  effective_date: z.string().optional().nullable(), // อาจจะใช้ Date picker หรือ Input type="date"
}).refine(data => {
  // Ensure weights are numbers before comparing, treat null/undefined as valid (or handle as needed)
  const minW = data.min_weight ?? -Infinity; // Treat null/undefined as no minimum
  const maxW = data.max_weight ?? Infinity;  // Treat null/undefined as no maximum
  return minW <= maxW;
}, {
  message: "Max weight must be greater than or equal to min weight",
  path: ["max_weight"], // แสดง error ที่ช่อง max_weight
});

type FreightRateFormValues = z.infer<typeof freightRateFormSchema>;

export default function NewFreightRatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [destinations, setDestinations] = useState<Pick<Destination, 'id' | 'country' | 'port'>[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Load destinations for dropdown
  useEffect(() => {
    async function loadDestinations() {
      setLoadingDestinations(true);
      try {
        const data = await getDestinations();
        setDestinations(data || []);
      } catch (err) {
        console.error("Error loading destinations:", err);
        toast.error("Could not load destinations for selection.");
      } finally {
        setLoadingDestinations(false);
      }
    }
    loadDestinations();
  }, []);

  const form = useForm<FreightRateFormValues>({
    resolver: zodResolver(freightRateFormSchema),
    defaultValues: {
      destination_id: undefined,
      min_weight: null,
      max_weight: null,
      base_rate: undefined,
      effective_date: null,
    },
  });

  const onSubmit = async (data: FreightRateFormValues) => {
    setIsSubmitting(true);

    try {
      // Prepare data for DB (Omit<FreightRate, ...>)
      const dataToSave = {
        destination_id: data.destination_id,
        min_weight: data.min_weight,
        max_weight: data.max_weight,
        base_rate: data.base_rate,
        effective_date: data.effective_date || null, // ส่ง null ถ้าไม่มีค่า
        // user_id จะถูกเพิ่มใน createFreightRate function
      };

      const newRate = await createFreightRate(dataToSave);

      if (newRate) {
        console.log('Saved freight rate to DB:', newRate);
        toast.success("Freight rate saved successfully!");
        router.push('/settings/freight-rate');
      } else {
        throw new Error('Failed to save freight rate to database.');
      }
    } catch (err: unknown) {
      console.error('Error saving freight rate:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error(`Error saving freight rate: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/freight-rate">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Freight Rate</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Freight Rate Details</CardTitle>
        </CardHeader>
        <CardContent>
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
                      defaultValue={field.value}
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
                          {/* ควรใช้ Date Picker component ถ้ามี หรือใช้ input type="date" */}
                          <Input type="date" placeholder="Optional" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/settings/freight-rate">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isSubmitting || loadingDestinations}>
                  {isSubmitting ? 'Saving...' : 'Save Freight Rate'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 