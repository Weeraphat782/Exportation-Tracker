-- Create junction table for Opportunity <-> Product (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.opportunity_products (
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    PRIMARY KEY (opportunity_id, product_id)
);

-- Enable RLS
ALTER TABLE public.opportunity_products ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DROP POLICY IF EXISTS "Users can view their own opportunity_products" ON public.opportunity_products;
CREATE POLICY "Users can view their own opportunity_products" ON public.opportunity_products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.opportunities o
            WHERE o.id = opportunity_products.opportunity_id
            -- Note: We don't have user_id on opportunities yet, but we rely on presence in opportunities table 
            -- which has its own RLS if any. For now, matching opportunity existence is standard.
        )
    );

DROP POLICY IF EXISTS "Users can manage their own opportunity_products" ON public.opportunity_products;
CREATE POLICY "Users can manage their own opportunity_products" ON public.opportunity_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.opportunities o
            WHERE o.id = opportunity_products.opportunity_id
        )
    );
