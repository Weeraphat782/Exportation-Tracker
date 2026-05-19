-- Fix: Staff cannot see document_submissions for customer quote requests until approval.
-- Root cause: pending_approval quotes have user_id NULL; existing RLS only allows SELECT
-- when quotation.user_id = auth.uid() OR customer_user_id matches.
--
-- Mirrors staff_can_view_pending_approval on quotations (add_customer_quote_requests.sql).
-- Apply once in Supabase: Dashboard → SQL Editor → paste and Run.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'document_submissions'
      AND policyname = 'staff_can_view_pending_approval_documents'
  ) THEN
    EXECUTE '
      CREATE POLICY "staff_can_view_pending_approval_documents"
      ON public.document_submissions
      FOR SELECT TO authenticated
      USING (
        quotation_id IN (
          SELECT id FROM quotations
          WHERE status = ''pending_approval''
          AND user_id IS NULL
        )
      )
    ';
  END IF;
END $$;
