-- Development Mode - ปิด RLS และอนุญาตให้ทำงานได้โดยไม่ต้อง authentication
-- หมายเหตุ: ใช้เฉพาะสำหรับ development เท่านั้น!

-- ปิด Row Level Security
ALTER TABLE packing_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE packing_list_pallets DISABLE ROW LEVEL SECURITY;  
ALTER TABLE packing_list_products DISABLE ROW LEVEL SECURITY;

-- ตรวจสอบว่า RLS ปิดแล้ว
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
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



