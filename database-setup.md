# คำแนะนำการตั้งค่าฐานข้อมูล Supabase

เอกสารนี้อธิบายขั้นตอนการตั้งค่าฐานข้อมูล Supabase สำหรับแอปพลิเคชัน Exportation Tracker

## สร้างโปรเจ็กต์ Supabase

1. ไปที่ [Supabase](https://supabase.com/) และลงชื่อเข้าใช้หรือสร้างบัญชีใหม่
2. คลิก "New Project" และตั้งชื่อโปรเจ็กต์ (เช่น "exportation-tracker")
3. เลือกภูมิภาค (Region) ที่ใกล้กับผู้ใช้งานของคุณ
4. ตั้งรหัสผ่านฐานข้อมูล (เก็บไว้ให้ดี)
5. คลิก "Create new project"

## ตั้งค่าไฟล์ .env.local

สร้างไฟล์ `.env.local` ที่รากของโปรเจ็กต์ และกำหนดค่า Supabase URL และ Supabase Key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

คุณสามารถหาค่าเหล่านี้ได้ในหน้า Project Settings > API ของแผงควบคุม Supabase

## สร้างโครงสร้างฐานข้อมูล

1. ในแผงควบคุม Supabase ไปที่แท็บ "SQL Editor"
2. คลิก "New Query"
3. คัดลอกและวางโค้ด SQL จากไฟล์ `database-schema.sql`
4. คลิก "Run" เพื่อสร้างตารางและฟังก์ชัน

## ตั้งค่า Storage Buckets

1. ไปที่แท็บ "Storage" ในแผงควบคุม Supabase
2. คลิก "Create new bucket"
3. สร้าง buckets ต่อไปนี้:
   - `documents` - สำหรับเอกสารที่อัปโหลดจากลูกค้า
   - `company-logos` - สำหรับโลโก้บริษัท
   - `quotation-attachments` - สำหรับไฟล์แนบใบเสนอราคา
4. สำหรับแต่ละ bucket ให้ตั้งค่าเป็น private และกำหนด RLS (Row Level Security) policies ที่เหมาะสม

### Storage Policies สำหรับ documents bucket

```sql
-- อนุญาตให้ผู้ใช้ที่ลงชื่อเข้าใช้ดาวน์โหลดเอกสารที่เกี่ยวข้องกับใบเสนอราคาของตนเอง
CREATE POLICY "Download documents for own quotations" ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid() IN (
    SELECT created_by FROM quotations
    WHERE id::text = storage.foldername(name)
  )
);

-- อนุญาตให้ใครก็ได้อัปโหลดเอกสาร (เนื่องจากลูกค้าจะอัปโหลดผ่านลิงก์แชร์)
CREATE POLICY "Anyone can upload documents" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');
```

## ตรวจสอบการตั้งค่าการยืนยันตัวตน

1. ไปที่ "Authentication" > "Providers" ในแผงควบคุม Supabase
2. เปิดใช้งาน Email provider
3. ตั้งค่า "Confirm email" เป็น "Optional" หรือ "Required" ตามที่ต้องการ
4. หากต้องการ คุณสามารถตั้งค่าการยืนยันตัวตนด้วย Google, Facebook หรือ provider อื่นๆ ตามที่ต้องการ

## ตรวจสอบการเชื่อมต่อ

1. ตรวจสอบว่าแอปพลิเคชันสามารถเชื่อมต่อกับ Supabase ได้โดยทดสอบการลงชื่อเข้าใช้
2. ตรวจสอบว่าฟังก์ชันใน `src/lib/db.ts` ทำงานได้ถูกต้อง

## ข้อมูลเริ่มต้น (ตัวอย่าง)

คุณสามารถใส่ข้อมูลตัวอย่างลงในฐานข้อมูลด้วยคำสั่ง SQL ต่อไปนี้:

```sql
-- เพิ่มข้อมูลตัวอย่างในตาราง destinations
INSERT INTO destinations (country, port, shipping_time, notes, user_id)
VALUES 
  ('Japan', 'Tokyo', 7, 'Regular shipping routes available', (SELECT id FROM auth.users LIMIT 1)),
  ('China', 'Shanghai', 5, 'High volume destination', (SELECT id FROM auth.users LIMIT 1)),
  ('South Korea', 'Busan', 6, 'Efficient customs processing', (SELECT id FROM auth.users LIMIT 1)),
  ('Vietnam', 'Ho Chi Minh', 3, 'Nearby destination', (SELECT id FROM auth.users LIMIT 1)),
  ('USA', 'Los Angeles', 25, 'Long distance shipping', (SELECT id FROM auth.users LIMIT 1)),
  ('Germany', 'Hamburg', 30, 'European hub', (SELECT id FROM auth.users LIMIT 1));

-- เพิ่มข้อมูลตัวอย่างในตาราง delivery_services
INSERT INTO delivery_services (name, service_type, contact_info, address, email, phone, user_id)
VALUES 
  ('Ocean Express', 'sea', 'John Doe', '123 Harbor St, Bangkok', 'contact@oceanexpress.com', '02-123-4567', (SELECT id FROM auth.users LIMIT 1)),
  ('Air Cargo Solutions', 'air', 'Jane Smith', '456 Airport Blvd, Bangkok', 'info@aircargo.com', '02-987-6543', (SELECT id FROM auth.users LIMIT 1)),
  ('Land Transport Co.', 'road', 'Mike Johnson', '789 Highway Dr, Bangkok', 'support@landtransport.com', '02-555-7890', (SELECT id FROM auth.users LIMIT 1));
```

## การแก้ไขปัญหา

- หากพบข้อผิดพลาด "Foreign key violation" เมื่อสร้างตาราง ให้ตรวจสอบว่าตารางอ้างอิงได้ถูกสร้างขึ้นแล้ว
- หากพบข้อผิดพลาดเกี่ยวกับ RLS policy ให้ตรวจสอบว่ามีการกำหนด policy ที่ถูกต้องและเปิดใช้งาน RLS สำหรับตารางนั้นๆ
- หากการอัปโหลดไฟล์ไม่ทำงาน ให้ตรวจสอบ Storage policies และสิทธิ์การเข้าถึง

## ทดสอบการทำงาน

ทดสอบการทำงานของฐานข้อมูลโดยการสร้างบัญชีผู้ใช้ สร้างบริษัท สร้างใบเสนอราคา และตรวจสอบว่าข้อมูลถูกบันทึกและเรียกดูได้อย่างถูกต้อง 