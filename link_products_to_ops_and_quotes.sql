-- Add product_id to opportunities
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Add product_id to quotations
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
