-- ============================================
-- FIX USER DATA ISOLATION
-- ============================================
-- ปัญหา: ข้อมูล Opportunities และ Quotations แสดงข้าม Account
-- สาเหตุ: RLS policies ใช้ USING (true) ทำให้ทุกคนเห็นข้อมูลทั้งหมด
-- แก้ไข: เปลี่ยน RLS policies ให้ filter ตาม user_id/owner_id
-- ============================================

-- ============================================
-- PART 1: FIX OPPORTUNITIES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can insert opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can update opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can delete opportunities" ON public.opportunities;

-- Create user-specific policies for opportunities
-- Users can only see their OWN opportunities (filter by owner_id)
CREATE POLICY "Users can view own opportunities" ON public.opportunities
    FOR SELECT TO authenticated 
    USING (owner_id = auth.uid());

-- Users can insert opportunities (auto-set owner_id)
CREATE POLICY "Users can insert own opportunities" ON public.opportunities
    FOR INSERT TO authenticated 
    WITH CHECK (owner_id = auth.uid());

-- Users can update their own opportunities
CREATE POLICY "Users can update own opportunities" ON public.opportunities
    FOR UPDATE TO authenticated 
    USING (owner_id = auth.uid());

-- Users can delete their own opportunities
CREATE POLICY "Users can delete own opportunities" ON public.opportunities
    FOR DELETE TO authenticated 
    USING (owner_id = auth.uid());

-- ============================================
-- PART 2: FIX QUOTATIONS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "quotations_policy_public" ON public.quotations;
DROP POLICY IF EXISTS "quotations_policy" ON public.quotations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.quotations;
DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can insert their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can delete their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can view own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can insert own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can delete own quotations" ON public.quotations;

-- Create user-specific policies for quotations
-- Users can only see their OWN quotations (filter by user_id)
CREATE POLICY "Users can view own quotations" ON public.quotations
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

-- Users can insert quotations
CREATE POLICY "Users can insert own quotations" ON public.quotations
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

-- Users can update their own quotations
CREATE POLICY "Users can update own quotations" ON public.quotations
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid());

-- Users can delete their own quotations
CREATE POLICY "Users can delete own quotations" ON public.quotations
    FOR DELETE TO authenticated 
    USING (user_id = auth.uid());

-- ============================================
-- PART 3: FIX COMPANIES TABLE (Optional - ถ้าต้องการ)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all access for all users" ON public.companies;
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;

-- Create user-specific policies for companies
CREATE POLICY "Users can view own companies" ON public.companies
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own companies" ON public.companies
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own companies" ON public.companies
    FOR DELETE TO authenticated 
    USING (user_id = auth.uid());

-- ============================================
-- PART 4: VERIFY RLS IS ENABLED
-- ============================================

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- IMPORTANT: After running this SQL, you need to update existing data
-- to set the correct owner_id/user_id for existing records.
-- ============================================

-- Example: Set owner_id for existing opportunities (run manually with correct user_id)
-- First, find your user ID: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- Then run:
-- UPDATE public.opportunities SET owner_id = 'YOUR-USER-UUID' WHERE owner_id IS NULL;
-- UPDATE public.quotations SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE public.companies SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;

