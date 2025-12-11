-- ลบตารางเดิมถ้ามี
DROP TABLE IF EXISTS quotations CASCADE;

-- สร้างตารางใหม่
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- User และ Company references
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id),
    contact_person TEXT NOT NULL,
    contract_no TEXT,
    
    -- Destination และรายละเอียดการขนส่ง
    destination_id UUID NOT NULL REFERENCES destinations(id),
    pallets JSONB NOT NULL DEFAULT '[]'::JSONB,
    delivery_service_required BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_vehicle_type TEXT NOT NULL CHECK (delivery_vehicle_type IN ('4wheel', '6wheel')),
    additional_charges JSONB NOT NULL DEFAULT '[]'::JSONB,
    
    -- ข้อมูลเพิ่มเติม
    notes TEXT,
    total_cost NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent')),
    
    -- ฟิลด์เก็บข้อมูล snapshot
    company_name TEXT,
    destination TEXT,
    
    -- ฟิลด์ timestamp มาตรฐาน
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- เปิดใช้ Row Level Security
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy สำหรับการจัดการข้อมูล
CREATE POLICY "Users can view their own quotations" ON quotations
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own quotations" ON quotations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own quotations" ON quotations
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete their own quotations" ON quotations
    FOR DELETE USING (auth.uid() = user_id); 