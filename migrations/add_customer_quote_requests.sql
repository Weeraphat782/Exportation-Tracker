-- Migration: Support customer-created quote requests
-- Customer สามารถสร้าง quote request ได้จาก Client Portal
-- โดยใส่แค่ pallet dimensions, staff จะเป็นคนเลือก destination/company/rate และ approve

-- 1. Make company_id, destination_id, and user_id nullable for customer-created quotes
ALTER TABLE quotations ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE quotations ALTER COLUMN destination_id DROP NOT NULL;
ALTER TABLE quotations ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add 'pending_approval' as a valid status (status is text, no constraint change needed)
-- But add a comment for documentation
COMMENT ON COLUMN quotations.status IS 'Valid statuses: draft, sent, accepted, rejected, docs_uploaded, completed, Shipped, pending_approval';

-- 3. RLS Policy: Allow customers to INSERT their own quote requests
-- Customer can only create quotes with their own customer_user_id and status must be pending_approval
CREATE POLICY "customers_can_insert_quote_requests" ON quotations
  FOR INSERT
  WITH CHECK (
    auth.uid() = customer_user_id
    AND status = 'pending_approval'
  );

-- 4. RLS Policy: Ensure customers can SELECT their own quotations (may already exist - use IF NOT EXISTS pattern)
-- If this policy already exists, this will fail gracefully. Run only if needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotations' AND policyname = 'customers_can_view_own_quotations'
  ) THEN
    EXECUTE 'CREATE POLICY "customers_can_view_own_quotations" ON quotations FOR SELECT USING (auth.uid() = customer_user_id)';
  END IF;
END $$;

-- 5. Staff should be able to see ALL quotations (including customer-created pending ones)
-- This may need adjustment based on existing RLS policies.
-- If staff currently only sees user_id = auth.uid(), we need to also allow them to see pending_approval quotes.
-- Option A: Add a policy that lets staff see pending_approval quotes where user_id IS NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotations' AND policyname = 'staff_can_view_pending_approval'
  ) THEN
    EXECUTE 'CREATE POLICY "staff_can_view_pending_approval" ON quotations FOR SELECT USING (status = ''pending_approval'' AND user_id IS NULL)';
  END IF;
END $$;

-- 6. Staff should be able to UPDATE pending_approval quotations (to approve them)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotations' AND policyname = 'staff_can_update_pending_approval'
  ) THEN
    EXECUTE 'CREATE POLICY "staff_can_update_pending_approval" ON quotations FOR UPDATE USING (status = ''pending_approval'' AND user_id IS NULL)';
  END IF;
END $$;
