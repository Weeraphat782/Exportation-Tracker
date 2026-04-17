-- ============================================================
-- Add customer e-signature columns + status 'signed'
-- ============================================================

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS customer_signature TEXT;

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS signed_company_name TEXT;

COMMENT ON COLUMN quotations.customer_signature IS 'Base64 PNG data URL of customer e-signature';
COMMENT ON COLUMN quotations.signed_at IS 'When the customer submitted the e-signature';
COMMENT ON COLUMN quotations.signed_company_name IS 'Company name snapshot at time of signing';

-- Refresh status CHECK to include 'signed' (constraint name may vary by migration history)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'quotations'::regclass
      AND conname = 'quotations_status_check'
  ) THEN
    ALTER TABLE quotations DROP CONSTRAINT quotations_status_check;
  END IF;
END $$;

ALTER TABLE quotations
  ADD CONSTRAINT quotations_status_check CHECK (
    status IN (
      'draft',
      'sent',
      'accepted',
      'rejected',
      'docs_uploaded',
      'completed',
      'Shipped',
      'pending_approval',
      'signed'
    )
  );

COMMENT ON COLUMN quotations.status IS 'Valid: draft, sent, accepted, rejected, docs_uploaded, completed, Shipped, pending_approval, signed';
