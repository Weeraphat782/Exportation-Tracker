# Packing List Database Migration Guide

## คำแนะนำการรัน Migration สำหรับ Packing List

เนื่องจากโปรเจ็กต์ยังไม่ได้ link กับ Supabase project คุณต้องรัน migration ด้วยตนเองผ่าน Supabase Dashboard

## ขั้นตอนการ Migration

### 1. เข้า Supabase Dashboard
1. ไปที่ [Supabase Dashboard](https://app.supabase.com/)
2. เลือกโปรเจ็กต์ของคุณ
3. ไปที่แท็บ **SQL Editor**

### 2. รัน Migration Script
1. คลิก **New Query**
2. คัดลอกโค้ด SQL จากไฟล์ `supabase/migrations/20250825065623_create_packing_lists_tables.sql`
3. วางในช่อง SQL Editor
4. คลิก **Run** เพื่อสร้างตารางและฟังก์ชัน

**หมายเหตุ**: ถ้าเกิด error เกี่ยวกับ `update_updated_at_column()` function ให้รัน SQL นี้ก่อน:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';
```

### 2.1. สำหรับ Production - เปิด RLS และใช้งานได้จริง
ระบบจะใช้ Row Level Security (RLS) เพื่อแยกข้อมูลตาม user โดยอัตโนมัติ

#### เปิด RLS สำหรับ Production
```sql
-- เปิด Row Level Security
ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_list_pallets ENABLE ROW LEVEL SECURITY;  
ALTER TABLE packing_list_products ENABLE ROW LEVEL SECURITY;
```

#### ตรวจสอบ RLS Policies
```sql
-- ตรวจสอบว่า RLS เปิดอยู่
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('packing_lists', 'packing_list_pallets', 'packing_list_products');

-- ตรวจสอบ RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('packing_lists', 'packing_list_pallets', 'packing_list_products');
```

#### ลบข้อมูลทดสอบเก่า
```sql
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
```

**✅ ระบบพร้อมใช้งาน**: หลังจากรัน SQL แล้ว ระบบจะทำงานได้เลยโดยไม่ต้อง authentication

### 3. ตรวจสอบการสร้างตาราง
หลังจากรัน SQL แล้ว ให้ตรวจสอบว่าตารางถูกสร้างขึ้นแล้วโดย:
1. ไปที่แท็บ **Table Editor**
2. ควรเห็นตารางใหม่ 3 ตาราง:
   - `packing_lists` (ตารางหลัก)
   - `packing_list_pallets` (ข้อมูล pallets)
   - `packing_list_products` (ข้อมูลสินค้า)

### 4. ตรวจสอบ Row Level Security (RLS)
ตารางทั้งหมดจะมี RLS เปิดใช้งานอยู่ ซึ่งจะทำให้แต่ละ user สามารถเข้าถึงข้อมูลของตัวเองเท่านั้น

## Features ที่ได้หลังจาก Migration

### ✅ ฟีเจอร์ใหม่ที่เพิ่มเข้ามา:
1. **Save Packing List**: บันทึก Packing List ลงฐานข้อมูล
2. **Load Packing List**: โหลด Packing List ที่เคยบันทึกไว้
3. **Auto-generate เลขที่**: เลขที่ Packing List จะถูกสร้างอัตโนมัติ (PL-2025-0001)
4. **รายการ Packing Lists**: ดูรายการทั้งหมดที่เคยสร้าง
5. **Generate PDF/Sankey ซ้ำ**: สามารถโหลดข้อมูลและสร้าง PDF/Sankey Chart ซ้ำได้

### 🎯 การใช้งาน:
1. **บันทึก**: คลิกปุ่ม "Save" ที่มุมขวาบน
2. **โหลด**: คลิกปุ่ม "Load" เพื่อเลือก Packing List ที่เคยบันทึกไว้
3. **เลขที่**: เลขที่ Packing List จะแสดงข้างชื่อหน้า (เช่น PL-2025-0001)

### 📊 Database Schema:

#### `packing_lists`
- เก็บข้อมูลหลักของ Packing List (Consigner, Consignee, Shipping details)
- Auto-generate เลขที่ด้วย trigger
- มี RLS ป้องกันข้อมูล

#### `packing_list_pallets`
- เก็บข้อมูล Pallets แต่ละอัน
- เชื่อมโยงกับ `packing_lists` ด้วย `packing_list_id`

#### `packing_list_products`
- เก็บข้อมูลสินค้าในแต่ละ Pallet
- รองรับ Mixed Products (2 สินค้าในกล่องเดียวกัน)
- เชื่อมโยงกับ `packing_list_pallets` ด้วย `pallet_id`

## การทดสอบ

หลังจากรัน migration แล้ว ให้ทดสอบฟีเจอร์ใหม่:

1. **สร้าง Packing List ใหม่**: กรอกข้อมูลและคลิก Save
2. **ตรวจสอบเลขที่**: ควรได้เลขที่ PL-2025-0001 (หรือเลขถัดไป)
3. **โหลดข้อมูล**: คลิก Load และเลือก Packing List ที่เพิ่งสร้าง
4. **Generate PDF**: ทดสอบสร้าง PDF จากข้อมูลที่โหลดมา
5. **Generate Sankey**: ทดสอบสร้าง Sankey Chart

## หมายเหตุ

- ข้อมูลจะถูกเก็บไว้ในฐานข้อมูล ไม่หายไปเมื่อ refresh หน้า
- แต่ละ user จะเห็นเฉพาะข้อมูลของตัวเองเท่านั้น (RLS)
- การแก้ไขข้อมูลจะต้องทำผ่าน API ที่สร้างไว้แล้ว

## API Endpoints ที่สร้างใหม่

- `GET /api/packing-lists` - ดึงรายการทั้งหมด
- `POST /api/packing-lists` - สร้างใหม่
- `GET /api/packing-lists/[id]` - ดึงข้อมูลรายการเดียว
- `PUT /api/packing-lists/[id]` - อัพเดต
- `DELETE /api/packing-lists/[id]` - ลบ
