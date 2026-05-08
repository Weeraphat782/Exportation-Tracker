-- Fix Quotations RLS to allow Staff/Admin access to ALL quotations
-- while keeping Customers restricted to their own data.

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can insert own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can delete own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Enable access for staff or owners" ON public.quotations;
DROP POLICY IF EXISTS "quotations_staff_admin_policy" ON public.quotations;

-- 2. Create a unified policy for ALL operations
-- Logic: 
-- - If you are the owner (user_id) -> Access granted
-- - If you are the customer (customer_user_id) -> Access granted
-- - If you are a Staff or Admin -> Access granted to EVERYTHING
CREATE POLICY "quotations_staff_admin_policy" ON public.quotations
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid() 
        OR customer_user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('staff', 'admin')
        )
    )
    WITH CHECK (
        user_id = auth.uid() 
        OR customer_user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('staff', 'admin')
        )
    );

-- 3. Verification query (optional to run)
-- SELECT schemaname, tablename, policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'quotations';
