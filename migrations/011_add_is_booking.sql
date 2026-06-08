-- Manual staff flag: quotation is in booking phase (independent of booking_status / email link)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_booking boolean NOT NULL DEFAULT false;
