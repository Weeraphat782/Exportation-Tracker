-- Proforma invoices linked to quotations (1 quote -> N proforma)

CREATE TABLE IF NOT EXISTS proforma_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  invoice_no TEXT,
  invoice_date DATE,
  customer_code TEXT,

  customer_name TEXT,
  customer_address TEXT,
  consignee_name TEXT,
  consignee_address TEXT,

  freight_type TEXT CHECK (freight_type IS NULL OR freight_type IN ('sea', 'air')),
  est_shipped_date DATE,
  est_gross_weight NUMERIC,
  est_net_weight NUMERIC,

  carrier TEXT,
  mawb TEXT,
  qty_wt NUMERIC,
  chargeable_weight NUMERIC,
  airport_destination TEXT,

  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  vat NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'signed', 'cancelled')),
  share_token TEXT UNIQUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proforma_invoices_quotation_id ON proforma_invoices(quotation_id);

COMMENT ON TABLE proforma_invoices IS 'Proforma invoices; customer signature comes from linked quotation';
