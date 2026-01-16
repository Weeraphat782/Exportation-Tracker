-- Fix RLS Permissions for Document Analysis History
-- Allows public access (SELECT/INSERT/UPDATE/DELETE) to match the project's dev setup

ALTER TABLE public.document_analysis_history ENABLE ROW LEVEL SECURITY;

-- Drop the restrictive policy I created earlier
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.document_analysis_history;

-- Create a blanket policy for everyone (FOR ALL TO public)
CREATE POLICY "analysis_history_policy_public" ON public.document_analysis_history
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Ensure user can read if RLS is disabled anyway (some tables have it disabled)
-- but keeping it enabled with a permissive policy is safer for Supabase client usage patterns here.

SELECT 'Permissions fixed for document_analysis_history' as status;
