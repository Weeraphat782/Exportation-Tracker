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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createDestination } from '@/lib/db';

const destinationFormSchema = z.object({
  country: z.string().min(1, { message: 'Country name is required' }),
  port: z.string().optional(),
});

type DestinationFormValues = z.infer<typeof destinationFormSchema>;

export default function NewDestinationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationFormSchema),
    defaultValues: {
      country: '',
      port: '',
    },
  });

  const onSubmit = async (data: DestinationFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newDestination = await createDestination(data);

      if (newDestination) {
        console.log('Saved destination to DB:', newDestination);
        router.push('/settings/destination');
      } else {
        throw new Error('Failed to save destination to database.');
      }
    } catch (err: unknown) {
      console.error('Error saving destination:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/destination">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Destination</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Destination Details</CardTitle>
        </CardHeader>
        <CardContent>
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Destination'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 