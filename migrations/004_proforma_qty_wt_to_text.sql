-- Convert proforma_invoices.qty_wt from NUMERIC to TEXT so users can enter
-- values with units, e.g. "2 plt / 145 kgs".

ALTER TABLE proforma_invoices
  ALTER COLUMN qty_wt TYPE TEXT USING qty_wt::text;
