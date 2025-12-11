-- อัพเดทข้อจำกัดของคอลัมน์ status เพื่อเพิ่มค่า 'completed'
ALTER TABLE quotations
DROP CONSTRAINT quotations_status_check;

-- สร้างข้อจำกัดใหม่ที่รองรับค่า 'completed'
ALTER TABLE quotations
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'docs_uploaded', 'completed'));

-- เพิ่มคอลัมน์ completed_at เพื่อเก็บวันที่ completed
ALTER TABLE quotations
ADD COLUMN completed_at TIMESTAMPTZ NULL; 