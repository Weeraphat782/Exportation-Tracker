-- ============================================================
-- Migration 008: Link companies to customer users
-- ============================================================
-- สิ่งที่ทำ:
--   1. เพิ่ม customer_user_id ใน companies เพื่อ link company กับ customer
--   2. แยก companies_policy (FOR ALL) เป็น policy ย่อย
--      - Staff: CRUD บริษัทของตัวเอง (user_id = auth.uid())
--      - Customer: CRUD บริษัทของตัวเอง (customer_user_id = auth.uid())
--      - Staff: SELECT บริษัทที่ customer สร้าง (สำหรับ dropdown ใน approval form)
--
-- ผลกระทบต่อระบบเดิม:
--   - Staff ยังเห็น/จัดการ companies ของตัวเองได้เหมือนเดิม
--   - Customer portal สามารถสร้าง company record ได้
--   - เมื่อ staff approve quotation, company ถูก pre-fill จาก company ของ customer
-- ============================================================

-- 1) เพิ่ม customer_user_id ใน companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_customer_user_id
  ON companies(customer_user_id);

-- 2) อัพเดต RLS
DROP POLICY IF EXISTS companies_policy ON companies;

-- Staff: full CRUD บริษัทของตัวเอง
CREATE POLICY "companies_staff_own" ON companies
  FOR ALL USING (user_id = auth.uid());

-- Customer: full CRUD บริษัทของตัวเอง (customer_user_id = auth.uid())
CREATE POLICY "companies_customer_own" ON companies
  FOR ALL USING (customer_user_id = auth.uid());

-- Staff: SELECT บริษัทที่ customer สร้าง (เพื่อ pre-fill ใน approval dropdown)
CREATE POLICY "companies_staff_see_customer" ON companies
  FOR SELECT TO authenticated
  USING (
    customer_user_id IS NOT NULL
    AND public.is_staff_or_admin()
  );

-- ============================================================
-- VERIFICATION
-- ============================================================
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'companies'
-- ORDER BY policyname;
