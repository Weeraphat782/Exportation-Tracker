-- SQL for registering Thai GACP and Farm document templates
-- Corrected to use the existing 'document_templates' table

INSERT INTO public.document_templates (document_type_id, document_name, file_url, file_name)
VALUES 
  ('thai-gacp-certificate-standard', 'Thai GACP or GACP Certificate', 'https://example.com/templates/thai-gacp-standard.pdf', 'thai-gacp-standard.pdf'),
  ('thai-gacp-certificate-farm', 'Thai GACP Certificate (Farm)', 'https://example.com/templates/thai-gacp-farm.pdf', 'thai-gacp-farm.pdf'),
  ('farm-purchase-order', 'Farm Purchase Order', 'https://example.com/templates/farm-po.pdf', 'farm-po.pdf'),
  ('farm-commercial-invoice', 'Farm Commercial Invoice', 'https://example.com/templates/farm-invoice.pdf', 'farm-invoice.pdf')
ON CONFLICT (document_type_id) DO UPDATE SET 
  document_name = EXCLUDED.document_name,
  file_url = EXCLUDED.file_url,
  file_name = EXCLUDED.file_name,
  updated_at = NOW();

-- Verify data
SELECT * FROM public.document_templates WHERE document_type_id LIKE '%thai-gacp%' OR document_type_id LIKE 'farm-%';
