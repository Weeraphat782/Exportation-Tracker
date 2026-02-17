-- Migration: Add share_token for public shipment tracking links
-- ลูกค้าสามารถสร้าง public link เพื่อแชร์สถานะ shipment ให้ปลายทางดูได้โดยไม่ต้อง login

-- 1. Add share_token column
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- 2. Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_quotations_share_token ON quotations(share_token);

-- 3. RLS: Allow anyone to SELECT quotations that have a share_token (public tracking)
CREATE POLICY "public_can_view_by_share_token" ON quotations
  FOR SELECT USING (share_token IS NOT NULL AND share_token != '');
