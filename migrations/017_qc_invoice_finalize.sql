-- QC invoice finalize: invoice numbering, discount, WHT, multi-COA, price gating

ALTER TABLE public.qc_requests
  ADD COLUMN IF NOT EXISTS invoice_no TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wht_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_payable NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_finalized BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_coa_date DATE,
  ADD COLUMN IF NOT EXISTS coa_paths JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS qc_requests_invoice_no_idx ON public.qc_requests(invoice_no);
CREATE INDEX IF NOT EXISTS qc_requests_price_finalized_idx ON public.qc_requests(price_finalized);

CREATE TABLE IF NOT EXISTS public.qc_invoice_counters (
  period TEXT PRIMARY KEY,
  last_no INT NOT NULL DEFAULT 0
);

-- Assign OMG{YYYY}{MM}{NNN} atomically; idempotent if invoice_no already set.
CREATE OR REPLACE FUNCTION public.assign_qc_invoice_no(p_request_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing TEXT;
  _period TEXT;
  _next_no INT;
  _invoice_no TEXT;
BEGIN
  IF NOT public.is_lab_admin_or_admin() THEN
    RAISE EXCEPTION 'Not authorized to assign invoice number';
  END IF;

  SELECT invoice_no INTO _existing
  FROM public.qc_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QC request not found';
  END IF;

  IF _existing IS NOT NULL AND trim(_existing) <> '' THEN
    RETURN _existing;
  END IF;

  _period := to_char(NOW() AT TIME ZONE 'Asia/Bangkok', 'YYYYMM');

  INSERT INTO public.qc_invoice_counters (period, last_no)
  VALUES (_period, 1)
  ON CONFLICT (period) DO UPDATE
    SET last_no = public.qc_invoice_counters.last_no + 1
  RETURNING last_no INTO _next_no;

  _invoice_no := 'OMG' || _period || lpad(_next_no::text, 3, '0');

  UPDATE public.qc_requests
  SET invoice_no = _invoice_no,
      updated_at = NOW()
  WHERE id = p_request_id
    AND (invoice_no IS NULL OR trim(invoice_no) = '');

  IF NOT FOUND THEN
    SELECT invoice_no INTO _existing
    FROM public.qc_requests
    WHERE id = p_request_id;
    RETURN _existing;
  END IF;

  RETURN _invoice_no;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_qc_invoice_no(UUID) TO authenticated;
