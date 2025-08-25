-- เปิด Row Level Security กลับมา (สำหรับ production)
-- หมายเหตุ: ใช้หลังจากทดสอบ development เสร็จแล้ว

-- เปิด RLS
ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_list_pallets ENABLE ROW LEVEL SECURITY;  
ALTER TABLE packing_list_products ENABLE ROW LEVEL SECURITY;

-- ตรวจสอบ RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('packing_lists', 'packing_list_pallets', 'packing_list_products');

-- ตรวจสอบว่า RLS เปิดอยู่
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('packing_lists', 'packing_list_pallets', 'packing_list_products');

-- ลบข้อมูลทดสอบ (ถ้ามี)
-- DELETE FROM packing_list_products WHERE pallet_id IN (
--   SELECT p.id FROM packing_list_pallets p
--   JOIN packing_lists pl ON p.packing_list_id = pl.id
--   WHERE pl.created_by IS NULL
-- );
-- DELETE FROM packing_list_pallets WHERE packing_list_id IN (
--   SELECT id FROM packing_lists WHERE created_by IS NULL
-- );
-- DELETE FROM packing_lists WHERE created_by IS NULL;


