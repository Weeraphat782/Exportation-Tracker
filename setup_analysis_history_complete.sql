-- ==========================================
-- COMPLETE SETUP: Document Analysis History
-- ==========================================

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.document_analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.document_comparison_rules(id),
  version INTEGER NOT NULL,
  results JSONB NOT NULL,
  critical_checks_results JSONB,
  status TEXT NOT NULL, -- 'PASS', 'FAIL', 'WARNING'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_analysis_history_opportunity_id 
ON public.document_analysis_history(opportunity_id);

-- 3. Enable RLS
ALTER TABLE public.document_analysis_history ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any old policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.document_analysis_history;
DROP POLICY IF EXISTS "analysis_history_policy_public" ON public.document_analysis_history;

-- 5. Create the permissive policy for development
CREATE POLICY "analysis_history_policy_public" ON public.document_analysis_history
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. Verify setup
SELECT 'Table created and permissions configured successfully!' as status;
