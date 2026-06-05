-- Air Freight booking share link (separate from e-sign / tracking share_token)
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS booking_share_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS booking_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS booking_air_freight JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS booking_confirmed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_quotations_booking_token ON quotations(booking_share_token);

CREATE POLICY "public_can_view_by_booking_token" ON quotations
  FOR SELECT USING (booking_share_token IS NOT NULL AND booking_share_token != '');
