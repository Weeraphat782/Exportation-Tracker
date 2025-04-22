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
import { createFreightRate, getDestinations, Destination, getFreightRates, FreightRate } from '@/lib/db';
import { toast } from 'react-hot-toast';

// Adjusted Schema: Use optional/nullable, refine handles null check
const freightRateFormSchema = z.object({
  destination_id: z.string().min(1, 'Destination is required'),
  // Coerce handles empty string input, positive ensures > 0 if provided
  min_weight: z.coerce.number().positive('Min weight must be positive').optional().nullable(), 
  max_weight: z.coerce.number().positive('Max weight must be positive').optional().nullable(), 
  base_rate: z.coerce.number().min(0.01, 'Base rate must be positive'),
  // Treat date as string, optional and nullable
  effective_date: z.string().optional().nullable(), 
}).refine(data => {
  // Only validate if both min and max weight are provided (not null/undefined)
  if (data.min_weight != null && data.max_weight != null) {
    return data.min_weight <= data.max_weight;
  }
  return true; // Pass validation if one or both are missing
}, {
  message: "Max weight must be greater than or equal to min weight",
  path: ["max_weight"], 
});

// Use z.infer to get type matching schema structure before defaults/transforms
type FreightRateFormValues = z.infer<typeof freightRateFormSchema>;

export default function NewFreightRatePage() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [existingRates, setExistingRates] = useState<FreightRate[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const form = useForm<FreightRateFormValues>({
    resolver: zodResolver(freightRateFormSchema),
    // Set defaults compatible with react-hook-form (undefined for optional, null for nullable)
    defaultValues: {
      destination_id: '',
      min_weight: null, // Use null for nullable fields
      max_weight: null, // Use null for nullable fields
      base_rate: undefined, // Use undefined for required number field initially
      effective_date: null, // Use null for nullable fields
    },
  });

  const { watch } = form;

  useEffect(() => {
    async function loadInitialData() {
      setLoadingDestinations(true);
      try {
        const [fetchedDestinations, fetchedRates] = await Promise.all([
          getDestinations(),
          getFreightRates() // Assuming this fetches FreightRate[]
        ]);
        setDestinations(fetchedDestinations || []);
        setExistingRates(fetchedRates || []);
      } catch (err) {
        const error = err as Error;
        console.error('Failed to load initial data:', error);
        toast.error(`Failed to load data: ${error.message}`);
      } finally {
        setLoadingDestinations(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    const subscription = watch((data) => {
      if (data.destination_id) {
        const existingRate = existingRates.find(rate => rate.destination_id === data.destination_id);
        if (existingRate) {
          form.reset({
            destination_id: data.destination_id, // keep current destination
            min_weight: existingRate.min_weight,
            max_weight: existingRate.max_weight,
            base_rate: existingRate.base_rate,
            effective_date: existingRate.effective_date,
          });
          setIsEditingExisting(true);
        } else {
          // Reset fields if destination changes and no matching rate found
          form.reset({
            destination_id: data.destination_id, // keep current destination
            min_weight: null, 
            max_weight: null, 
            base_rate: undefined, 
            effective_date: null 
          });
          setIsEditingExisting(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [watch, existingRates, form]); 

  const onSubmit = async (data: FreightRateFormValues) => {
    setIsSubmitting(true);
    setError(null);

    // Data from form (type FreightRateFormValues) should be compatible
    // with what createFreightRate expects (Partial<FreightRate>)
    // if FreightRate allows nulls for optional fields.
    const dataToSave: Partial<FreightRate> = { 
      destination_id: data.destination_id,
      // Pass min/max weight directly (null or number)
      min_weight: data.min_weight, 
      max_weight: data.max_weight, 
      base_rate: data.base_rate, // base_rate is required number
      // Pass effective_date directly (null or string)
      effective_date: data.effective_date,
    };

    try {
      const existingRateMatch = existingRates.find(
        rate => 
          rate.destination_id === data.destination_id &&
          // Compare potentially null values
          (rate.min_weight === data.min_weight) && 
          (rate.max_weight === data.max_weight)
      );

      if (existingRateMatch && !isEditingExisting) { // Avoid error if we are editing the matched rate
          toast.error('A rate with the same destination and weight range already exists.');
          setIsSubmitting(false);
          return;
      }

      
      // createFreightRate expects Partial<FreightRate> and returns FreightRate | null
      // Ensure required fields like destination_id are present before calling
      if (!dataToSave.destination_id) {
          setError("Destination ID is missing."); // Should not happen due to form validation
          setIsSubmitting(false);
          return;
      }
      const newRate = await createFreightRate(dataToSave as Omit<FreightRate, "id" | "created_at" | "updated_at" | "currency" | "vehicle_type" | "container_size">); // Use type assertion if confident

      if (newRate) {
        console.log('Saved freight rate to DB:', newRate);
        toast.success('Freight rate saved successfully!');
        router.push('/settings/freight-rate');
      } else {
        throw new Error('Failed to save freight rate to database.');
      }
    } catch (err: unknown) {
      console.error('Error saving freight rate:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred saving the rate.');
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
                      value={field.value} // Use value for controlled component
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
                          {/* Input value needs to be string or number, handle null/undefined */}
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
                          {/* Handle undefined for required number */}
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
                <Button type="submit" disabled={isSubmitting || loadingDestinations}>
                  {isSubmitting ? 'Saving...' : (isEditingExisting ? 'Update Freight Rate' : 'Save Freight Rate')} 
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 