-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type_id VARCHAR(255) NOT NULL UNIQUE,
  document_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(1024) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Allow all users to read templates
CREATE POLICY "Templates are viewable by all users" 
ON document_templates FOR SELECT 
USING (true);

-- Only allow authenticated users to insert/update/delete templates
CREATE POLICY "Templates can be inserted by authenticated users" 
ON document_templates FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Templates can be updated by authenticated users" 
ON document_templates FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Templates can be deleted by authenticated users" 
ON document_templates FOR DELETE 
TO authenticated
USING (true);

-- Insert example templates for each document type
INSERT INTO document_templates (document_type_id, document_name, file_url, file_name)
VALUES
  ('company-registration', 'Company Registration', 'https://example.com/templates/company-registration.pdf', 'company-registration-example.pdf'),
  ('company-declaration', 'Company Declaration', 'https://example.com/templates/company-declaration.pdf', 'company-declaration-example.pdf'),
  ('id-card-copy', 'ID Card Copy', 'https://example.com/templates/id-card-copy.pdf', 'id-card-copy-example.pdf'),
  ('import-permit', 'Import Permit', 'https://example.com/templates/import-permit.pdf', 'import-permit-example.pdf'),
  ('tk-10', 'TK 10', 'https://example.com/templates/tk-10.pdf', 'tk-10-example.pdf'),
  ('tk-11', 'TK 11', 'https://example.com/templates/tk-11.pdf', 'tk-11-example.pdf'),
  ('tk-31', 'TK 31', 'https://example.com/templates/tk-31.pdf', 'tk-31-example.pdf'),
  ('tk-32', 'TK 32', 'https://example.com/templates/tk-32.pdf', 'tk-32-example.pdf'),
  ('purchase-order', 'Purchase Order', 'https://example.com/templates/purchase-order.pdf', 'purchase-order-example.pdf'),
  ('msds', 'MSDS', 'https://example.com/templates/msds.pdf', 'msds-example.pdf'),
  ('commercial-invoice', 'Commercial Invoice', 'https://example.com/templates/commercial-invoice.pdf', 'commercial-invoice-example.pdf'),
  ('packing-list', 'Packing List', 'https://example.com/templates/packing-list.pdf', 'packing-list-example.pdf'),
  ('additional-file', 'Additional File', 'https://example.com/templates/additional-file.pdf', 'additional-file-example.pdf')
ON CONFLICT (document_type_id) DO 
UPDATE SET 
  document_name = EXCLUDED.document_name,
  file_url = EXCLUDED.file_url,
  file_name = EXCLUDED.file_name,
  updated_at = NOW(); 