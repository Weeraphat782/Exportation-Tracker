-- ============================================================
-- Migration 007: Granular profiles RLS + customer self-update
-- ============================================================
-- สิ่งที่ทำ:
--   แยก profiles_policy (FOR ALL) ออกเป็น policy ย่อย
--   เพื่อป้องกัน customer อัพเดต role ของตัวเองเป็น staff/admin
--
-- ผลกระทบ:
--   - Customer อ่าน/อัพเดต profile ตัวเองได้ (full_name, company, etc.)
--   - Customer เปลี่ยน role ไม่ได้ (role ต้องคง 'customer' ไว้หลัง UPDATE)
--   - Staff/admin ยังคงทำงานได้เหมือนเดิมทุกประการ
-- ============================================================

-- ลบ policy เดิมที่กว้างเกินไป
DROP POLICY IF EXISTS profiles_policy ON profiles;

-- SELECT: เห็น profile ตัวเอง (staff SELECT ครอบคลุมโดย "Staff can view customer profiles" จาก migration 005)
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- INSERT: ใส่ record ของตัวเองเท่านั้น (trigger handle_new_user ใช้ path นี้)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- UPDATE: แก้ไข profile ตัวเอง แต่ customer ห้ามเปลี่ยน role
--   WITH CHECK ตรวจค่า row หลัง UPDATE:
--     - is_staff_or_admin() → staff/admin แก้ได้ทุก column รวม role
--     - role = 'customer' → customer แก้ได้แต่ role ต้องยังเป็น 'customer'
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      public.is_staff_or_admin()
      OR role = 'customer'
    )
  );

-- DELETE: ลบ profile ตัวเองได้ (เหมือนเดิม)
CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (id = auth.uid());

-- ============================================================
-- VERIFICATION
-- ============================================================
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'profiles'
-- ORDER BY policyname;
