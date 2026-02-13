-- ============================================================
-- Step 1: Add Customer Support to Database
-- ============================================================
-- สิ่งที่ทำ:
--   1. เพิ่ม role column ใน profiles (default = 'staff')
--   2. เพิ่ม customer_user_id column ใน quotations (nullable)
--
-- ผลกระทบต่อระบบเดิม: ไม่มี
--   - user เดิมทั้งหมดจะได้ role = 'staff' อัตโนมัติ
--   - quotation เดิมทั้งหมดจะมี customer_user_id = NULL (ยังไม่ assign)
--   - RLS policy เดิมไม่เปลี่ยน
--   - ทุกอย่างทำงานเหมือนเดิม 100%
-- ============================================================

-- =====================
-- 1) เพิ่ม role ใน profiles
-- =====================
-- ค่าที่เป็นไปได้: 'admin', 'staff', 'customer'
-- Default = 'staff' เพื่อให้ user เดิมทั้งหมดเป็น staff อัตโนมัติ

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'staff';

-- เพิ่ม check constraint เพื่อป้องกันค่าที่ไม่ถูกต้อง
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'staff', 'customer'));

-- =====================
-- 2) เพิ่ม customer_user_id ใน quotations
-- =====================
-- nullable เพราะ quotation เดิมยังไม่ได้ assign ให้ customer
-- Staff จะเป็นคนกด assign ทีหลัง

ALTER TABLE quotations 
  ADD COLUMN IF NOT EXISTS customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- สร้าง index เพื่อให้ query เร็วเวลา customer ดึง quotation ของตัวเอง
CREATE INDEX IF NOT EXISTS idx_quotations_customer_user_id 
  ON quotations(customer_user_id);

-- สร้าง index สำหรับ role เพื่อให้ middleware/query เร็ว
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles(role);
