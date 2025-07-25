# Environment Variables Setup Guide

## สร้างไฟล์ .env.local

ให้สร้างไฟล์ `.env.local` ที่ root directory ของโปรเจ็กต์ และใส่ค่าดังนี้:

```env
# Supabase Configuration
# หา values เหล่านี้ได้จาก Supabase Dashboard > Settings > API

# Client-side (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here

# Server-side (private) 
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: OpenTyphoon AI API (สำหรับ AI document analysis)
TYPHOON_API_KEY=your-typhoon-api-key-here
```

## วิธีการหาค่า Supabase Keys

1. เข้าไปที่ [Supabase Dashboard](https://app.supabase.com/)
2. เลือกโปรเจ็กต์ของคุณ
3. ไปที่ **Settings** > **API**
4. คัดลอกค่าดังนี้:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` และ `SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## หลังจากตั้งค่าแล้ว

1. Restart development server (`npm run dev`)
2. ตรวจสอบว่าไม่มี error "Supabase client not initialized" อีก

## สำคัญ ⚠️

- **อย่า commit** ไฟล์ `.env.local` เข้า Git
- เก็บ `service_role` key ไว้เป็นความลับ
- ใช้ `anon` key สำหรับ client-side เท่านั้น 