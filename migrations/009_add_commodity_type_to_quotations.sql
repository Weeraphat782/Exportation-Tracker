-- Add commodity_type to quotations (cannabis | hemp) for document checklist presets
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS commodity_type VARCHAR(50) NOT NULL DEFAULT 'cannabis';

COMMENT ON COLUMN quotations.commodity_type IS 'Document preset: cannabis | hemp';
