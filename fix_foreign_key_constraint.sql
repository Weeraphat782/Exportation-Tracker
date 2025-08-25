-- แก้ไข Foreign Key Constraint เพื่อให้ยอมรับ NULL สำหรับ development
-- หมายเหตุ: อย่าใช้ใน production!

-- ลบ foreign key constraint เดิม
ALTER TABLE packing_lists DROP CONSTRAINT IF EXISTS packing_lists_created_by_fkey;

-- สร้าง foreign key constraint ใหม่ที่ยอมรับ NULL
ALTER TABLE packing_lists 
ADD CONSTRAINT packing_lists_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ตรวจสอบว่าตารางสามารถรับ NULL ได้
-- ถ้ายังไม่ได้ ให้ใช้คำสั่งนี้:
-- ALTER TABLE packing_lists ALTER COLUMN created_by DROP NOT NULL;

-- สำหรับ development - ตั้งค่า created_by เป็น NULL ได้
-- UPDATE packing_lists SET created_by = NULL WHERE created_by = '00000000-0000-0000-0000-000000000000';

