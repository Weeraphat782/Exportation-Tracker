-- ============================================
-- FIX USER DATA ISOLATION v2
-- ============================================
-- แก้ไขปัญหา: ข้อมูล Opportunities และ Quotations แสดงข้าม Account
-- Version 2: ใช้ column ที่ถูกต้อง (user_id สำหรับ quotations)
-- ============================================

-- ============================================
-- PART 1: FIX OPPORTUNITIES TABLE
-- ============================================

-- Drop ALL existing policies on opportunities
DROP POLICY IF EXISTS "Users can view all opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can insert opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can update opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can delete opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can view own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can insert own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can update own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can delete own opportunities" ON public.opportunities;

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Create user-specific policies (filter by owner_id)
CREATE POLICY "Users can view own opportunities" ON public.opportunities
    FOR SELECT TO authenticated 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own opportunities" ON public.opportunities
    FOR INSERT TO authenticated 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own opportunities" ON public.opportunities
    FOR UPDATE TO authenticated 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own opportunities" ON public.opportunities
    FOR DELETE TO authenticated 
    USING (owner_id = auth.uid());

-- ============================================
-- PART 2: FIX QUOTATIONS TABLE
-- ============================================

-- Drop ALL existing policies on quotations
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

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Create user-specific policies (filter by user_id - NOT created_by)
CREATE POLICY "Users can view own quotations" ON public.quotations
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own quotations" ON public.quotations
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quotations" ON public.quotations
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own quotations" ON public.quotations
    FOR DELETE TO authenticated 
    USING (user_id = auth.uid());

-- ============================================
-- PART 3: FIX COMPANIES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all access for all users" ON public.companies;
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete own companies" ON public.companies;

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create user-specific policies
-- Allow viewing companies that belong to the user OR have no user_id (shared)
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
-- VERIFICATION: Show policies after creation
-- ============================================
-- Run this to verify:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('opportunities', 'quotations', 'companies');

