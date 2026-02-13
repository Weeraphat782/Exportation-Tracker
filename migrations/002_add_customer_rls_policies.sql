-- ============================================================
-- Step 2: Add RLS Policies for Customer Access
-- ============================================================
-- สิ่งที่ทำ:
--   1. เพิ่ม policy ให้ customer ดู quotation ที่ถูก assign ให้ (ผ่าน customer_user_id)
--   2. เพิ่ม policy ให้ customer ดู/อัพโหลด documents ของ quotation ที่ assign ให้
--   3. เพิ่ม policy ให้ customer ดู profile ของตัวเอง
--
-- ผลกระทบต่อระบบเดิม: ไม่มี
--   - ใช้ DROP IF EXISTS + CREATE ใหม่ เฉพาะ policy ที่ต้องแก้
--   - Staff policy เดิมถูกรวมไว้ใน policy ใหม่ (เงื่อนไขเดิม OR เงื่อนไขใหม่)
--   - Staff ทำงานได้เหมือนเดิมทุกประการ
-- ============================================================


-- =====================
-- 1) PROFILES - ให้ customer อ่าน profile ตัวเอง
-- =====================
-- Policy เดิม: profiles_policy → id = auth.uid() (FOR ALL)
-- ไม่ต้องแก้เลย เพราะ customer ก็ใช้ id = auth.uid() เหมือนกัน
-- Customer จะเห็นเฉพาะ profile ตัวเอง ✅


-- =====================
-- 2) QUOTATIONS - ให้ customer ดู quotation ที่ assign ให้
-- =====================
-- Policy เดิม: "Users can view own quotations" → user_id = auth.uid()
-- ต้องเพิ่ม: OR customer_user_id = auth.uid()

-- SELECT: Staff ดูของตัวเอง (user_id) + Customer ดูที่ assign ให้ (customer_user_id)
DROP POLICY IF EXISTS "Users can view own quotations" ON public.quotations;
CREATE POLICY "Users can view own quotations" ON public.quotations
    FOR SELECT TO authenticated 
    USING (
        user_id = auth.uid()                -- staff เห็น quotation ที่ตัวเองสร้าง (เหมือนเดิม)
        OR customer_user_id = auth.uid()    -- customer เห็น quotation ที่ assign ให้
    );

-- INSERT: เฉพาะ staff เท่านั้น (ไม่แก้ เหมือนเดิม)
-- Policy เดิม "Users can insert own quotations" ยังใช้ user_id = auth.uid()
-- Customer จะ insert ไม่ได้เพราะ user_id ไม่ตรง → ✅ ปลอดภัย

-- UPDATE: Staff แก้ได้ + Customer แก้ไม่ได้
-- Policy เดิม "Users can update own quotations" ใช้ user_id = auth.uid()
-- Customer ไม่มี user_id ตรง → แก้ไม่ได้ → ✅ ปลอดภัย

-- DELETE: Staff ลบได้ + Customer ลบไม่ได้
-- Policy เดิม "Users can delete own quotations" ใช้ user_id = auth.uid()
-- Customer ไม่มี user_id ตรง → ลบไม่ได้ → ✅ ปลอดภัย


-- =====================
-- 3) DOCUMENT_SUBMISSIONS - ให้ customer ดู + อัพโหลด documents
-- =====================
-- Policy เดิม: ดูผ่าน quotation_id → quotations.user_id = auth.uid()
-- ต้องเพิ่ม: OR quotations.customer_user_id = auth.uid()

-- SELECT: Staff + Customer ดูเอกสารของ quotation ที่เกี่ยวข้อง
DROP POLICY IF EXISTS "Users can view their own document submissions" ON public.document_submissions;
CREATE POLICY "Users can view their own document submissions" ON public.document_submissions
    FOR SELECT TO authenticated
    USING (
        quotation_id IN (
            SELECT id FROM quotations 
            WHERE user_id = auth.uid()              -- staff (เหมือนเดิม)
               OR customer_user_id = auth.uid()     -- customer
        )
    );

-- INSERT: Staff + Customer อัพโหลดเอกสารได้
-- หมายเหตุ: มี policy "Anyone can insert documents" อยู่แล้ว (FOR INSERT WITH CHECK true)
-- ไม่ต้องเพิ่มอะไร → ✅

-- UPDATE: Staff แก้ได้ (review/approve)
DROP POLICY IF EXISTS "Users can update their own document submissions" ON public.document_submissions;
CREATE POLICY "Users can update their own document submissions" ON public.document_submissions
    FOR UPDATE TO authenticated
    USING (
        quotation_id IN (
            SELECT id FROM quotations 
            WHERE user_id = auth.uid()              -- staff แก้สถานะเอกสาร (เหมือนเดิม)
        )
    );

-- DELETE: Staff เท่านั้น (เหมือนเดิม ไม่แก้)


-- =====================
-- 4) DOCUMENT_ANALYSIS_HISTORY - ให้ customer ดูผลวิเคราะห์
-- =====================
-- ให้ customer ดูผลวิเคราะห์เอกสารของ quotation ที่ assign ให้

DROP POLICY IF EXISTS "customer_view_analysis_history" ON public.document_analysis_history;
CREATE POLICY "customer_view_analysis_history" ON public.document_analysis_history
    FOR SELECT TO authenticated
    USING (
        quotation_id IN (
            SELECT id FROM quotations 
            WHERE user_id = auth.uid()              -- staff (เดิม)
               OR customer_user_id = auth.uid()     -- customer
        )
    );


-- ============================================================
-- VERIFICATION: ตรวจสอบ policies หลัง run
-- ============================================================
-- Run คำสั่งนี้เพื่อตรวจสอบ:
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('profiles', 'quotations', 'document_submissions', 'document_analysis_history')
-- ORDER BY tablename, policyname;
