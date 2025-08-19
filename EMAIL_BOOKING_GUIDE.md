# Email Booking Module - User Guide

## Overview
Email Booking Module เป็นฟีเจอร์ใหม่ที่ช่วยให้คุณสร้างอีเมลจองการขนส่งจาก Quotation ที่มีอยู่ได้อย่างง่ายดาย โดยจะใช้ข้อมูลจาก Quotation มาแสดงในรูปแบบอีเมลที่เป็นมาตรฐาน

## Features

### 🚀 **Core Features**
- **Auto-fill จาก Quotation**: ดึงข้อมูลจาก Quotation มาใส่อัตโนมัติ
- **Email Template**: รูปแบบอีเมลมาตรฐานตามที่กำหนด
- **Live Preview**: ดูตัวอย่างอีเมลแบบ real-time
- **Copy & Paste**: คัดลอกเนื้อหาอีเมลได้ทันที
- **Email Client Integration**: เปิดใน email client ของคุณ
- **Export PDF**: ส่งออกเป็น PDF สำหรับเก็บเอกสาร
- **Print Support**: พิมพ์เอกสารได้ทันที

### 📋 **Email Format**
ระบบจะสร้างอีเมลตามรูปแบบที่กำหนดไว้:

```
Dear Khun [Recipient Name], 

I would like to book the following shipment:

Product: [Product Name]
Destination: [Destination]
Net Weight: [Weight] KG
Airline: [Airline]
Pick-up from BKK (location and date TBC)
Prefer shipment date: [Date]

Please see attached all documents krub.

MAWB: TBC
DESCRIPTION OF CONTENTS, INCLUDING MODEL/MANUFACTURER: [Product Description]
WEIGHT: [Weight] KG
NUMBER OF PIECE: [Number] Pallets
PALLET DIMENSION: [Length] × [Width] × [Height] cm
ORIGIN: BKK
DESTINATION: [Destination]
SHIPPER: [Company Name]
CONSIGNEE: [Consignee Company]
ROUTING: [Origin Code]- [Destination Code]

Best Regards,
[Your Name]
```

## How to Use

### 1. **เข้าถึง Email Booking**
- **จาก Sidebar**: คลิก "Email Booking" ใน navigation menu
- **จาก Quotation List**: คลิกปุ่ม 📧 (Mail icon) ในแถวของ Quotation ที่ต้องการ

### 2. **สร้าง Email Booking**
1. เลือก Quotation ที่ต้องการสร้างอีเมล
2. กรอกข้อมูลเพิ่มเติมที่จำเป็น:
   - **Recipient Name**: ชื่อผู้รับ (เช่น Montri)
   - **Your Name**: ชื่อของคุณ (เช่น Weeraphat)
   - **Airline**: สายการบิน (เช่น Thai Airways)
   - **Consignee**: บริษัทผู้รับ (เช่น Czech Work s.r.o.)
   - **Routing**: เส้นทาง (เช่น BKK-MUC)
   - **Preferred Shipment Date**: วันที่ต้องการส่ง

### 3. **ข้อมูลที่ดึงจาก Quotation อัตโนมัติ**
- **Product**: "Dried Cannabis Flower" (ค่าคงที่)
- **Destination**: ประเทศปลายทาง
- **Net Weight**: น้ำหนักจริง (Actual Weight) จาก pallet data
- **Shipper**: ชื่อบริษัทจาก company_name
- **Pallet Dimensions**: ขนาดพาเลทจาก pallet data
- **Number of Pieces**: จำนวนพาเลทเท่านั้น

### 4. **การใช้งานฟีเจอร์ต่างๆ**

#### **📋 Copy Content**
- **Copy Subject**: คัดลอกหัวข้ออีเมล
- **Copy All**: คัดลอกเนื้อหาอีเมลทั้งหมด

#### **📧 Send Email**
- **Open in Email Client**: เปิดใน email app ของคุณพร้อมเนื้อหา

#### **📄 Export & Print**
- **Export PDF**: ส่งออกเป็น PDF สำหรับเก็บเอกสาร
- **Print**: พิมพ์เอกสารโดยตรง

## Data Mapping

### จาก Quotation Database:
| Database Field | Email Field | Description |
|---------------|-------------|-------------|
| (Fixed Value) | Product | "Dried Cannabis Flower" |
| `destination` | Destination | ประเทศปลายทาง |
| `pallets[].weight` (sum) | Net Weight | น้ำหนักจริง (Actual Weight) |
| `company_name` | Shipper | บริษัทผู้ส่ง |
| `pallets[0].length/width/height` | Pallet Dimension | ขนาดพาเลท |
| `pallets.length` | Number of Pieces | จำนวนพาเลท (แค่พาเลทเท่านั้น) |

### ข้อมูลที่ต้องกรอกเพิ่ม:
- Recipient Name
- Airline
- Consignee
- Routing
- Preferred Shipment Date

### ข้อมูลที่เป็นค่าคงที่:
- **Product**: "Dried Cannabis Flower" (เสมอ)
- **DESCRIPTION OF CONTENTS**: "Dried Cannabis Flower" (เสมอ)
- **Your Name**: "Weeraphat" (เสมอ)
- **Origin**: "BKK" (เสมอ)

## File Structure

```
src/
├── app/(main)/email-booking/
│   ├── page.tsx                    # รายการ Quotation ที่จองได้
│   └── [id]/page.tsx              # หน้าสร้างอีเมล
├── lib/
│   ├── email-templates.ts         # Email template functions
│   └── email-pdf-generator.ts     # PDF export functions
└── components/sidebar.tsx         # เพิ่ม Email Booking menu
```

## API Functions

### `generateBookingEmailFromQuotation(quotation, additionalData)`
สร้างข้อมูลอีเมลจาก Quotation object

### `formatBookingEmail(emailData)`
แปลงข้อมูลเป็น email content ตามรูปแบบที่กำหนด

### `generateEmailSubject(emailData)`
สร้างหัวข้ออีเมลอัตโนมัติ

### `generateEmailBookingPDF(emailData, quotation, emailContent)`
ส่งออกเป็น PDF file

## Access Control

- เฉพาะ Quotation ที่มีสถานะ `accepted`, `docs_uploaded`, หรือ `completed` เท่านั้นที่จะแสดงในรายการ Email Booking
- ต้อง login เพื่อเข้าถึงฟีเจอร์นี้
- แต่ละผู้ใช้เห็นเฉพาะ Quotation ของตัวเอง (Row Level Security)

## Tips & Best Practices

### ✅ **Do's**
- ตรวจสอบข้อมูลก่อนส่งอีเมลทุกครั้ง
- กรอกข้อมูล Consignee และ Routing ให้ครบถ้วน
- ใช้ Export PDF เพื่อเก็บเอกสารอ้างอิง
- ตรวจสอบน้ำหนักและขนาดพาเลทให้ตรงกับความเป็นจริง

### ❌ **Don'ts**
- อย่าลืมกรอกชื่อผู้รับและผู้ส่ง
- อย่าส่งอีเมลโดยไม่ได้ตรวจสอบข้อมูล
- อย่าใช้กับ Quotation ที่ยังไม่ได้รับการอนุมัติ

## Troubleshooting

### **ปัญหาที่พบบ่อย:**

1. **ไม่เห็น Quotation ในรายการ**
   - ตรวจสอบสถานะ Quotation (ต้องเป็น accepted/docs_uploaded/completed)
   - ตรวจสอบการ login

2. **ข้อมูลไม่ครบ**
   - ข้อมูลบางส่วนอาจไม่มีใน Quotation เดิม
   - กรอกข้อมูลที่ขาดหายไปในฟอร์ม

3. **PDF Export ไม่ทำงาน**
   - ตรวจสอบ browser compatibility
   - ลองใช้ Print แทน

4. **Email Client ไม่เปิด**
   - ตรวจสอบการตั้งค่า default email client
   - ใช้ Copy All แล้วไปวางในอีเมลแทน

## Future Enhancements

- **Email Templates**: รองรับ template หลายแบบ
- **Auto Send**: ส่งอีเมลอัตโนมัติผ่าน API
- **Email History**: เก็บประวัติการส่งอีเมล
- **Batch Booking**: สร้างอีเมลหลาย Quotation พร้อมกัน
- **Custom Fields**: เพิ่มฟิลด์ที่กำหนดเองได้
