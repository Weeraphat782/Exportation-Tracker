-- Fix RLS Permissions for BOTH Opportunities and Quotations
-- This is critical for cascading deletes (Opportunity -> Quotations)

-- 1. Opportunities Table
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all opportunities" ON public.opportunities;
CREATE POLICY "Users can view all opportunities" ON public.opportunities FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert opportunities" ON public.opportunities;
CREATE POLICY "Users can insert opportunities" ON public.opportunities FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update opportunities" ON public.opportunities;
CREATE POLICY "Users can update opportunities" ON public.opportunities FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Users can delete opportunities" ON public.opportunities;
CREATE POLICY "Users can delete opportunities" ON public.opportunities FOR DELETE TO public USING (true);


-- 2. Quotations Table (CRITICAL: Needs Update/Delete for Cascade to work)
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Drop verify existing policies to clean up
DROP POLICY IF EXISTS "quotations_policy_public" ON public.quotations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.quotations;

-- Create a blanket policy for Quotes (Dev Mode)
CREATE POLICY "quotations_policy_public" ON public.quotations
    FOR ALL TO public USING (true);

-- 3. Destinations & Companies (Ensure they are readable so Dropdowns work in Edit)
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view destinations" ON public.destinations;
CREATE POLICY "Users can view destinations" ON public.destinations FOR SELECT TO public USING (true);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
CREATE POLICY "Users can view companies" ON public.companies FOR SELECT TO public USING (true);
