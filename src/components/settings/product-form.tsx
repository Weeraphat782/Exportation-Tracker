'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash, Loader2 } from 'lucide-react';
import { Product, saveProductWithCharges } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const productFormSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    product_charges: z.array(z.object({
        name: z.string().min(1, 'Charge name is required'),
        description: z.string().optional(),
        amount: z.coerce.number().min(0, 'Amount must be at least 0'),
    })),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
    initialData?: Product;
}

export function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            product_charges: initialData?.product_charges?.map(c => ({
                name: c.name,
                description: c.description || '',
                amount: c.amount,
            })) || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        name: 'product_charges',
        control: form.control,
    });

    const onSubmit = async (values: ProductFormValues) => {
        setLoading(true);
        try {
            const { name, description, product_charges } = values;
            await saveProductWithCharges(
                { name, description },
                product_charges,
                initialData?.id
            );

            toast.success(initialData ? 'Product updated successfully' : 'Product created successfully');
            router.push('/settings/products');
            router.refresh();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Phyto, Certificate of Origin" {...field} />
                                    </FormControl>
                                    <FormDescription>The name of the product category.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the purpose of this product..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Default Charges</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: '', description: '', amount: 0 })}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Charge
                        </Button>
                    </div>

                    {fields.length === 0 && (
                        <p className="text-sm text-slate-500 italic text-center py-4 border-2 border-dashed rounded-lg">
                            No default charges added yet. Click &quot;Add Charge&quot; above.
                        </p>
                    )}

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="relative">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => remove(index)}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`product_charges.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Charge Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Handling Fee" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`product_charges.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`product_charges.${index}.amount`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount (THB)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/settings/products')}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? 'Update Product' : 'Create Product'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
