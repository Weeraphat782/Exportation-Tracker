-- ============================================================
-- Fix: Auto-create profile when new user registers
-- ============================================================
-- ลบ trigger เดิมก่อน (ถ้ามี)
-- ============================================================

-- ลบ trigger + function เดิม
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- สร้างฟังก์ชันใหม่ (robust version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role TEXT;
BEGIN
  -- ดึง role จาก metadata ถ้ามี ไม่งั้นใช้ 'staff'
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'staff');
  
  -- ตรวจสอบว่า role ถูกต้อง (ต้องตรงกับ CHECK constraint)
  IF _role NOT IN ('admin', 'staff', 'customer') THEN
    _role := 'staff';
  END IF;

  -- Insert profile (ถ้ามีอยู่แล้วให้ update)
  INSERT INTO public.profiles (id, email, full_name, company, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    _role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name = '' THEN profiles.full_name ELSE EXCLUDED.full_name END,
    company = CASE WHEN EXCLUDED.company = '' THEN profiles.company ELSE EXCLUDED.company END,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- ถ้า error ไม่ block การ signup (log ไว้แต่ไม่ fail)
    RAISE WARNING 'handle_new_user trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
