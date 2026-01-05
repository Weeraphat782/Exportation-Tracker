-- Fix Foreign Key Constraint on Quotations table
-- This ensures that deleting an Opportunity does not fail, but instead sets the quotation's opportunity_id to NULL.

DO $$
BEGIN
    -- 1. Try to drop the existing constraint. 
    -- We need to know the name. Postgres auto-names it usually like 'quotations_opportunity_id_fkey'.
    -- We'll try to drop it by the most common name.
    
    ALTER TABLE public.quotations DROP CONSTRAINT IF EXISTS quotations_opportunity_id_fkey;

    -- 2. Also try to drop the column constraint if it was named differently (unlikely but safe)
    -- If we can't guess the name, we can modify the column type.
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
END $$;

-- 3. Re-add the Foreign Key Constraint explicitly
-- This ensures strict naming and behavior
ALTER TABLE public.quotations
ADD CONSTRAINT quotations_opportunity_id_fkey
FOREIGN KEY (opportunity_id)
REFERENCES public.opportunities(id)
ON DELETE SET NULL;

-- 4. Re-apply RLS Policies for Opportunities (Just to be absolutely sure)
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all opportunities" ON public.opportunities;
CREATE POLICY "Users can view all opportunities" ON public.opportunities FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert opportunities" ON public.opportunities;
CREATE POLICY "Users can insert opportunities" ON public.opportunities FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update opportunities" ON public.opportunities;
CREATE POLICY "Users can update opportunities" ON public.opportunities FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Users can delete opportunities" ON public.opportunities;
CREATE POLICY "Users can delete opportunities" ON public.opportunities FOR DELETE TO public USING (true);
