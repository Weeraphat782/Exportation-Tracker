-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create product charges table
CREATE TABLE IF NOT EXISTS public.product_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_charges ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for products
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
CREATE POLICY "Users can view their own products" ON public.products
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
CREATE POLICY "Users can insert their own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
CREATE POLICY "Users can update their own products" ON public.products
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
CREATE POLICY "Users can delete their own products" ON public.products
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for product_charges (linked to products)
DROP POLICY IF EXISTS "Users can view charges for visible products" ON public.product_charges;
CREATE POLICY "Users can view charges for visible products" ON public.product_charges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products 
            WHERE products.id = product_charges.product_id
        )
    );

DROP POLICY IF EXISTS "Users can insert charges for their own products" ON public.product_charges;
CREATE POLICY "Users can insert charges for their own products" ON public.product_charges
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products 
            WHERE products.id = product_charges.product_id 
            AND (products.user_id = auth.uid() OR products.user_id IS NULL)
        )
    );

DROP POLICY IF EXISTS "Users can update charges for their own products" ON public.product_charges;
CREATE POLICY "Users can update charges for their own products" ON public.product_charges
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.products 
            WHERE products.id = product_charges.product_id 
            AND products.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete charges for their own products" ON public.product_charges;
CREATE POLICY "Users can delete charges for their own products" ON public.product_charges
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.products 
            WHERE products.id = product_charges.product_id 
            AND products.user_id = auth.uid()
        )
    );
