-- ปิด Row Level Security สำหรับ development
-- หมายเหตุ: อย่าใช้ใน production!

ALTER TABLE packing_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE packing_list_pallets DISABLE ROW LEVEL SECURITY;  
ALTER TABLE packing_list_products DISABLE ROW LEVEL SECURITY;

-- ถ้าต้องการเปิดกลับมาใน production ให้ใช้:
-- ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE packing_list_pallets ENABLE ROW LEVEL SECURITY;  
-- ALTER TABLE packing_list_products ENABLE ROW LEVEL SECURITY;


