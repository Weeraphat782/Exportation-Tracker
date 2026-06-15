-- QC Request: store lab-admin-entered FM-QC-019 form fields as JSONB
ALTER TABLE public.qc_requests
  ADD COLUMN IF NOT EXISTS lab_form_data JSONB NOT NULL DEFAULT '{}'::jsonb;
