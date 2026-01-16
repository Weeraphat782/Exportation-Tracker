-- Create document_analysis_history table
CREATE TABLE IF NOT EXISTS document_analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES document_comparison_rules(id),
  version INTEGER NOT NULL,
  results JSONB NOT NULL,
  critical_checks_results JSONB,
  status TEXT NOT NULL, -- 'PASS', 'FAIL', 'WARNING'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Index for faster lookup by opportunity
CREATE INDEX IF NOT EXISTS idx_analysis_history_opportunity_id ON document_analysis_history(opportunity_id);

-- Enable RLS
ALTER TABLE document_analysis_history ENABLE ROW LEVEL SECURITY;

-- Simple policy for authenticated users
CREATE POLICY "Allow all for authenticated users" ON document_analysis_history
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
