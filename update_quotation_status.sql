-- อัพเดทข้อจำกัดของคอลัมน์ status เพื่อเพิ่มค่า 'docs_uploaded'
ALTER TABLE quotations
DROP CONSTRAINT quotations_status_check;

-- สร้างข้อจำกัดใหม่ที่รองรับค่า 'docs_uploaded'
ALTER TABLE quotations
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'docs_uploaded')); 