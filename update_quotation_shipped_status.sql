-- ขั้นตอนที่ 1: เพิ่มคอลัมน์ booked_at ก่อน (ถ้ายังไม่มี)
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ NULL;

-- ขั้นตอนที่ 2: อัปเดตข้อมูลเก่าก่อนสร้าง constraint ใหม่
-- อัปเดท quotations ที่มี status เป็น 'Shipped' ให้เป็น 'Booked'
UPDATE quotations 
SET status = 'Booked', booked_at = COALESCE(updated_at, created_at)
WHERE status = 'Shipped';

-- อัปเดต quotations ที่มี status ไม่ถูกต้อง ให้เป็น 'draft'
UPDATE quotations 
SET status = 'draft'
WHERE status NOT IN ('draft', 'sent', 'accepted', 'rejected', 'docs_uploaded', 'completed', 'Booked');

-- ขั้นตอนที่ 3: ลบ constraint เก่า
ALTER TABLE quotations
DROP CONSTRAINT IF EXISTS quotations_status_check;

-- ขั้นตอนที่ 4: สร้าง constraint ใหม่ที่รองรับ 'Booked'
ALTER TABLE quotations
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'docs_uploaded', 'completed', 'Booked'));

-- ขั้นตอนที่ 5: เพิ่ม index สำหรับการค้นหาข้อมูล booked quotations
CREATE INDEX IF NOT EXISTS idx_quotations_status_booked 
ON quotations (status) WHERE status = 'Booked';

-- ขั้นตอนที่ 6: ลบ column shipped_at ถ้ามี (เพราะเปลี่ยนเป็น booked_at แล้ว)
ALTER TABLE quotations
DROP COLUMN IF EXISTS shipped_at; 