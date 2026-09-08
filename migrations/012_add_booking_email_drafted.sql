-- Idempotency flag: MCP / Grok Bot already drafted booking email for this quotation
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS booking_email_drafted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS booking_email_drafted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_quotations_booking_email_drafted_at
  ON quotations (booking_email_drafted_at)
  WHERE booking_email_drafted_at IS NULL;
