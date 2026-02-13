-- ============================================================
-- Step 5: Allow staff to read customer profiles (for assignment)
-- ============================================================
-- สิ่งที่ทำ:
--   Staff ต้องอ่าน profiles ของ customer ได้ เพื่อ assign quotation
--   ใช้ SECURITY DEFINER function เพื่อ check role อย่างปลอดภัย
--
-- ผลกระทบ: ไม่กระทบระบบเดิม
--   - Staff เห็น profile ตัวเอง + customer profiles (read-only)
--   - Customer ยังเห็นแค่ profile ตัวเอง
--   - ไม่มีใครแก้ไข profile คนอื่นได้
-- ============================================================

-- 1) สร้าง helper function (SECURITY DEFINER เพื่อ bypass RLS)
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2) เพิ่ม policy ให้ staff/admin อ่าน customer profiles ได้
CREATE POLICY "Staff can view customer profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    -- เห็น profile ตัวเอง (เหมือนเดิม - ซ้ำกับ policy เดิมแต่ไม่เป็นไร)
    id = auth.uid()
    OR
    -- Staff/admin เห็น customer profiles
    (role = 'customer' AND public.is_staff_or_admin())
  );

-- 3) เพิ่ม policy ให้ staff update customer_user_id ใน quotations
-- (ควรมีอยู่แล้วจาก quotations_policy FOR ALL แต่เพิ่มเพื่อความชัดเจน)
-- policy เดิม quotations_policy: FOR ALL USING (created_by = auth.uid() OR last_updated_by = auth.uid())
-- ยังใช้ได้ เพราะ staff เป็น created_by อยู่แล้ว → update ได้เลย
