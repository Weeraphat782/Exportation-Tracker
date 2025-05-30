-- ขั้นตอนที่ 1: ตรวจสอบข้อมูล status ที่มีอยู่ในระบบ
-- (รันคำสั่งนี้เพื่อดูว่ามี status อะไรบ้าง)
-- SELECT DISTINCT status, COUNT(*) FROM quotations GROUP BY status;

-- ขั้นตอนที่ 2: ลบ constraint เดิมทั้งหมดก่อน
ALTER TABLE quotations 
DROP CONSTRAINT IF EXISTS quotations_status_check;

-- ขั้นตอนที่ 3: เพิ่มคอลัมน์ booked_at หากยังไม่มี
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ NULL;

-- ขั้นตอนที่ 4: ทำความสะอาดข้อมูล status ทั้งหมด
-- แปลง NULL เป็น 'draft'
UPDATE quotations 
SET status = 'draft' 
WHERE status IS NULL;

-- แปลง string ว่างเป็น 'draft'
UPDATE quotations 
SET status = 'draft' 
WHERE status = '';

-- แปลง 'Shipped' เป็น 'Booked'
UPDATE quotations 
SET status = 'Booked', 
    booked_at = COALESCE(updated_at, created_at, NOW())
WHERE status = 'Shipped';

-- แปลง status ที่ไม่ถูกต้องทั้งหมดเป็น 'draft'
UPDATE quotations 
SET status = 'draft'
WHERE status NOT IN ('draft', 'sent', 'accepted', 'rejected', 'docs_uploaded', 'completed', 'Booked');

-- ขั้นตอนที่ 5: อัปเดต booked_at สำหรับรายการที่เป็น 'Booked' แต่ยังไม่มี timestamp
UPDATE quotations 
SET booked_at = COALESCE(updated_at, created_at, NOW())
WHERE status = 'Booked' AND booked_at IS NULL;

-- ขั้นตอนที่ 6: ตรวจสอบข้อมูลอีกครั้งก่อนสร้าง constraint
-- (รันคำสั่งนี้เพื่อยืนยันว่าข้อมูลสะอาดแล้ว)
-- SELECT DISTINCT status, COUNT(*) FROM quotations GROUP BY status;

-- ขั้นตอนที่ 7: สร้าง constraint ใหม่
ALTER TABLE quotations
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'docs_uploaded', 'completed', 'Booked'));

-- ขั้นตอนที่ 8: เพิ่ม index สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_quotations_status_booked 
ON quotations (status) WHERE status = 'Booked';

-- ขั้นตอนที่ 9: ลบคอลัมน์เก่าที่ไม่ใช้แล้ว
ALTER TABLE quotations
DROP COLUMN IF EXISTS shipped_at;

-- ขั้นตอนที่ 10: ยืนยันผลลัพธ์
-- SELECT 'Constraint applied successfully!' as result; 