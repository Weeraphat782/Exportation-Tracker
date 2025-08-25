-- สร้าง mock user สำหรับ development
-- เพิ่ม mock user ใน auth.users table (สำหรับ development เท่านั้น)

-- ตรวจสอบว่ามี mock user อยู่แล้วหรือไม่
DO $$
BEGIN
  -- เพิ่ม mock user ถ้ายังไม่มี
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'dev@example.com',
      '$2a$10$dummy.hash.for.development.only',
      NOW(),
      NULL,
      '',
      NULL,
      '',
      NULL,
      '',
      '',
      NULL,
      NOW(),
      '{}',
      '{}',
      false,
      NOW(),
      NOW(),
      NULL,
      NULL,
      '',
      '',
      NULL,
      '',
      0,
      NULL,
      '',
      NULL
    );
  END IF;
END $$;

-- อัพเดต RLS policies เพื่อให้ development mode ทำงานได้
-- ปิด RLS สำหรับ development (ระวัง: อย่าใช้ใน production!)
-- ALTER TABLE packing_lists DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE packing_list_pallets DISABLE ROW LEVEL SECURITY;  
-- ALTER TABLE packing_list_products DISABLE ROW LEVEL SECURITY;

-- หรือใช้วิธีนี้: อนุญาตให้ mock user เข้าถึงได้
DROP POLICY IF EXISTS packing_lists_policy ON packing_lists;
DROP POLICY IF EXISTS packing_list_pallets_policy ON packing_list_pallets;
DROP POLICY IF EXISTS packing_list_products_policy ON packing_list_products;

-- สร้าง policy ใหม่ที่อนุญาต mock user
CREATE POLICY packing_lists_policy ON packing_lists
  FOR ALL USING (
    created_by = auth.uid() 
    OR created_by = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY packing_list_pallets_policy ON packing_list_pallets
  FOR ALL USING (
    packing_list_id IN (
      SELECT id FROM packing_lists 
      WHERE created_by = auth.uid() 
         OR created_by = '00000000-0000-0000-0000-000000000000'
    )
  );

CREATE POLICY packing_list_products_policy ON packing_list_products
  FOR ALL USING (
    pallet_id IN (
      SELECT p.id FROM packing_list_pallets p
      JOIN packing_lists pl ON p.packing_list_id = pl.id
      WHERE pl.created_by = auth.uid()
         OR pl.created_by = '00000000-0000-0000-0000-000000000000'
    )
  );


