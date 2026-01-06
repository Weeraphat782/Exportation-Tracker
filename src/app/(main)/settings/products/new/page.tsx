'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ProductForm } from '@/components/settings/product-form';

export default function NewProductPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/settings/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">New Product</h1>
                    <p className="text-slate-500">Create a new product template with default charges</p>
                </div>
            </div>

            <ProductForm />
        </div>
    );
}

import { Button } from '@/components/ui/button';
