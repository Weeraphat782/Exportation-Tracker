-- Production Mode - เปิด RLS และใช้งานได้จริง
-- หมายเหตุ: ใช้สำหรับ production ที่ต้องการความปลอดภัย

-- เปิด Row Level Security
ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_list_pallets ENABLE ROW LEVEL SECURITY;  
ALTER TABLE packing_list_products ENABLE ROW LEVEL SECURITY;

-- ตรวจสอบว่า RLS เปิดแล้ว
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('packing_lists', 'packing_list_pallets', 'packing_list_products');

-- ตรวจสอบ RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('packing_lists', 'packing_list_pallets', 'packing_list_products');

-- ลบข้อมูลทดสอบเก่า (ถ้ามี)
DELETE FROM packing_list_products WHERE pallet_id IN (
  SELECT p.id FROM packing_list_pallets p
  JOIN packing_lists pl ON p.packing_list_id = pl.id
  WHERE pl.created_by IS NULL
);
DELETE FROM packing_list_pallets WHERE packing_list_id IN (
  SELECT id FROM packing_lists WHERE created_by IS NULL
);
DELETE FROM packing_lists WHERE created_by IS NULL;

-- ตรวจสอบข้อมูลที่เหลือ
SELECT COUNT(*) as total_packing_lists FROM packing_lists;
SELECT COUNT(*) as total_pallets FROM packing_list_pallets;
SELECT COUNT(*) as total_products FROM packing_list_products;


