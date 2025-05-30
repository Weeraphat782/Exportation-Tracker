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
import { getCompanyById, updateCompany } from '@/lib/db';

const companyFormSchema = z.object({
  name: z.string().min(1, { message: 'Company name is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  contact_person: z.string().optional(),
  contact_email: z.string().email({ message: 'Please enter a valid email address' }).optional(),
  contact_phone: z.string().optional(),
  tax_id: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      address: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      tax_id: '',
    },
  });

  useEffect(() => {
    async function loadCompany() {
      if (!companyId) {
        setError("Invalid company ID.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const company = await getCompanyById(companyId);
        
        if (company) {
          form.reset({
            name: company.name || '',
            address: company.address || '',
            contact_person: company.contact_person || '',
            contact_email: company.contact_email || '',
            contact_phone: company.contact_phone || '',
            tax_id: company.tax_id || '',
          });
        } else {
          setError(`Company with ID ${companyId} not found.`);
        }
      } catch (err) {
        console.error('Error loading company:', err);
        setError('An unexpected error occurred while loading company details.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCompany();
  }, [companyId, form]);

  const onSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!companyId) {
        throw new Error("Invalid company ID.");
      }

      const updates = { ...data };
      
      const updatedCompany = await updateCompany(companyId, updates);
      
      if (updatedCompany) {
        console.log('Updated company in DB:', updatedCompany);
        router.push('/settings/company');
      } else {
        throw new Error('Failed to update company in database.');
      }

    } catch (err: unknown) {
      console.error('Error updating company:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Loading company data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/company">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Company</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && !isLoading && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
              <p>Error: {error}</p>
              <Link href="/settings/company">
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tax_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tax ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact person name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company address" {...field} />
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
                  <Link href="/settings/company">
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting || isLoading || !!error}>
                    {isSubmitting ? 'Saving...' : 'Update Company'}
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