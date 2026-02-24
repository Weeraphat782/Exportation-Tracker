-- Add storage_provider column to document_submissions
ALTER TABLE document_submissions ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'supabase';

-- Add storage_provider column to quotations (for AWB, Customs, and Shipment Photos)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'supabase';

-- Ensure existing records are marked as 'supabase'
UPDATE document_submissions SET storage_provider = 'supabase' WHERE storage_provider IS NULL;
UPDATE quotations SET storage_provider = 'supabase' WHERE storage_provider IS NULL;

-- Optional: Index for performance if needed
CREATE INDEX IF NOT EXISTS idx_doc_submissions_storage_provider ON document_submissions(storage_provider);
