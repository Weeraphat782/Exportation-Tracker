-- Drop the table if it exists
DROP TABLE IF EXISTS document_submissions CASCADE;

-- Create the document_submissions table
CREATE TABLE document_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_type_id TEXT,
  category TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  notes TEXT,
  description TEXT, -- AI-generated document summary
  status TEXT DEFAULT 'submitted', -- submitted, reviewed, approved, rejected
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE document_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own document submissions" ON document_submissions
  FOR SELECT USING (
    quotation_id IN (
      SELECT id FROM quotations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert document submissions for their quotations" ON document_submissions
  FOR INSERT WITH CHECK (
    quotation_id IN (
      SELECT id FROM quotations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own document submissions" ON document_submissions
  FOR UPDATE USING (
    quotation_id IN (
      SELECT id FROM quotations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own document submissions" ON document_submissions
  FOR DELETE USING (
    quotation_id IN (
      SELECT id FROM quotations WHERE user_id = auth.uid()
    )
  );

-- Anyone can submit documents (for client document uploads via shared link)
CREATE POLICY "Anyone can insert documents" ON document_submissions
  FOR INSERT WITH CHECK (true); 