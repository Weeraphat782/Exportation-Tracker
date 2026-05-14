-- Per-line VAT eligibility for quotations (staff editor)
-- total_cost remains pre-VAT; vat_amount = 7% of VAT-eligible base

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS taxable_lines JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total_with_vat NUMERIC DEFAULT 0;

COMMENT ON COLUMN quotations.taxable_lines IS
  'Per-line VAT flags. Keys: freight, clearance, delivery, additional:<index>. Missing key = VAT-eligible (true).';

COMMENT ON COLUMN quotations.vat_amount IS
  'VAT 7% on VAT-eligible amount portions of freight, clearance, delivery, additional charges.';

COMMENT ON COLUMN quotations.grand_total_with_vat IS
  'total_cost + vat_amount';
