-- ============================================================
-- Fix: Staff cannot see document_submissions for pending_approval quotes
-- ============================================================
-- Problem:
--   - Customer submits quote request -> quotations.user_id = NULL, status = 'pending_approval'
--   - Customer uploads documents -> document_submissions row created
--   - Staff visits /document-submissions but sees nothing
--
-- Root cause:
--   The existing SELECT policy "Users can view their own document submissions"
--   (002_add_customer_rls_policies.sql:60) requires:
--      quotation.user_id = auth.uid()      (staff path)
--   OR quotation.customer_user_id = auth.uid()  (customer path)
--   Pending quotes have NULL user_id, so neither branch matches for staff.
--
-- Fix:
--   Add an additive SELECT policy that lets ANY authenticated user
--   read document_submissions whose quotation is in pending_approval status.
--   This mirrors "staff_can_view_pending_approval" on quotations table
--   (add_customer_quote_requests.sql:43).
--
-- How to run:
--   Supabase Dashboard -> SQL Editor -> paste this whole file -> Run
--   Re-running is safe (DROP + CREATE).
-- ============================================================


-- ============================================================
-- 1) document_submissions: allow SELECT when quote is pending_approval
-- ============================================================
DROP POLICY IF EXISTS "staff_can_view_pending_approval_documents"
    ON public.document_submissions;

CREATE POLICY "staff_can_view_pending_approval_documents"
    ON public.document_submissions
    FOR SELECT
    TO authenticated
    USING (
        quotation_id IN (
            SELECT id FROM public.quotations
            WHERE status = 'pending_approval'
        )
    );


-- ============================================================
-- 2) (Safety net) Re-assert the matching policy on quotations.
--    If it was accidentally dropped, staff won't see the parent
--    quote rows -> the subquery above returns nothing -> docs hidden.
-- ============================================================
DROP POLICY IF EXISTS "staff_can_view_pending_approval"
    ON public.quotations;

CREATE POLICY "staff_can_view_pending_approval"
    ON public.quotations
    FOR SELECT
    TO authenticated
    USING (
        status = 'pending_approval'
        AND user_id IS NULL
    );


-- ============================================================
-- 3) Allow staff to UPDATE docs on pending_approval quotes too
--    (so review/approve/reject works before the quote is approved).
--    The pre-existing UPDATE policy only matches user_id = auth.uid(),
--    which is NULL for pending quotes.
-- ============================================================
DROP POLICY IF EXISTS "staff_can_update_pending_approval_documents"
    ON public.document_submissions;

CREATE POLICY "staff_can_update_pending_approval_documents"
    ON public.document_submissions
    FOR UPDATE
    TO authenticated
    USING (
        quotation_id IN (
            SELECT id FROM public.quotations
            WHERE status = 'pending_approval'
        )
    )
    WITH CHECK (
        quotation_id IN (
            SELECT id FROM public.quotations
            WHERE status = 'pending_approval'
        )
    );


-- ============================================================
-- VERIFY 1: List current policies on document_submissions + quotations
-- (You should see the three new policies above in the result.)
-- ============================================================
SELECT
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('document_submissions', 'quotations')
ORDER BY tablename, policyname;


-- ============================================================
-- VERIFY 2: Do pending quotes actually have documents?
-- (If doc_count = 0 for every row, the customer never uploaded
--  and the bug isn't RLS.)
-- ============================================================
SELECT
    q.id           AS quote_id,
    q.status,
    q.user_id      AS quote_user_id,
    q.customer_user_id,
    q.created_at,
    COUNT(ds.id)   AS doc_count
FROM public.quotations q
LEFT JOIN public.document_submissions ds ON ds.quotation_id = q.id
WHERE q.status = 'pending_approval'
GROUP BY q.id, q.status, q.user_id, q.customer_user_id, q.created_at
ORDER BY q.created_at DESC
LIMIT 20;
