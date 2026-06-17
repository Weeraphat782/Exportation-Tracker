-- FM-QC-019 fixed catalog selections + lab-admin test standards (GACP, etc.)

ALTER TABLE public.qc_requests
  ALTER COLUMN template_id DROP NOT NULL;

ALTER TABLE public.qc_requests
  ADD COLUMN IF NOT EXISTS catalog_selections JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.qc_test_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  selections JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qc_test_standards_is_active_idx ON public.qc_test_standards(is_active);

ALTER TABLE public.qc_test_standards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lab admin manage qc test standards" ON public.qc_test_standards;
CREATE POLICY "Lab admin manage qc test standards" ON public.qc_test_standards
  FOR ALL TO authenticated
  USING (public.is_lab_admin_or_admin())
  WITH CHECK (public.is_lab_admin_or_admin());

DROP POLICY IF EXISTS "Customers read active qc test standards" ON public.qc_test_standards;
CREATE POLICY "Customers read active qc test standards" ON public.qc_test_standards
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'customer')
  );
