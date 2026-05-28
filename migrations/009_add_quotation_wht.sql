-- 3% withholding tax (WHT) on VAT-taxable subtotal, deducted from payable grand total
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS wht_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wht_amount NUMERIC DEFAULT 0;

ALTER TABLE proforma_invoices
  ADD COLUMN IF NOT EXISTS wht_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wht_amount NUMERIC DEFAULT 0;

-- grand_total / grand_total_with_vat remain subtotal + VAT 7%
-- net payable = grand_total_with_vat - wht_amount (when wht_enabled)
