-- Ensure dependencies exist
-- Fix RLS Policies for Opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy
DROP POLICY IF EXISTS "Users can view all opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.opportunities; -- In case old name exists
CREATE POLICY "Users can view all opportunities" ON public.opportunities
    FOR SELECT TO public USING (true);

-- 2. INSERT Policy
DROP POLICY IF EXISTS "Users can insert opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.opportunities; -- In case old name exists
CREATE POLICY "Users can insert opportunities" ON public.opportunities
    FOR INSERT TO public WITH CHECK (true);

-- 3. UPDATE Policy
DROP POLICY IF EXISTS "Users can update opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.opportunities; -- In case old name exists
CREATE POLICY "Users can update opportunities" ON public.opportunities
    FOR UPDATE TO public USING (true);

-- 4. DELETE Policy
DROP POLICY IF EXISTS "Users can delete opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.opportunities; -- In case old name exists
CREATE POLICY "Users can delete opportunities" ON public.opportunities
    FOR DELETE TO public USING (true);
