-- Create document_comparison_rules table
CREATE TABLE IF NOT EXISTS document_comparison_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- AI Configuration
  extraction_fields JSONB DEFAULT '[]'::jsonb,
  comparison_instructions TEXT NOT NULL,
  critical_checks JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rules_user_id ON document_comparison_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_is_default ON document_comparison_rules(is_default);

-- Enable Row Level Security
ALTER TABLE document_comparison_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_comparison_rules' 
    AND policyname = 'Users can view their own rules'
  ) THEN
    CREATE POLICY "Users can view their own rules"
      ON document_comparison_rules
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_comparison_rules' 
    AND policyname = 'Users can create their own rules'
  ) THEN
    CREATE POLICY "Users can create their own rules"
      ON document_comparison_rules
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_comparison_rules' 
    AND policyname = 'Users can update their own rules'
  ) THEN
    CREATE POLICY "Users can update their own rules"
      ON document_comparison_rules
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_comparison_rules' 
    AND policyname = 'Users can delete their own rules'
  ) THEN
    CREATE POLICY "Users can delete their own rules"
      ON document_comparison_rules
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Insert default rule
INSERT INTO document_comparison_rules (
  user_id,
  name,
  description,
  extraction_fields,
  comparison_instructions,
  critical_checks,
  is_default
)
SELECT 
  id as user_id,
  'Standard Export Verification',
  'Complete verification for export documents including Commercial Invoice, Packing List, and Export Permit',
  '[
    "consignor_name",
    "consignor_address",
    "consignee_name",
    "consignee_address",
    "hs_code",
    "permit_number",
    "po_number",
    "country_of_origin",
    "country_of_destination",
    "quantity",
    "total_value",
    "shipping_marks",
    "shipped_from",
    "shipped_to",
    "document_date"
  ]'::jsonb,
  'You are performing a comprehensive cross-document verification for an export shipment.

ALL DOCUMENTS AND THEIR EXTRACTED DATA:
{allDocuments}

YOUR TASK:
Compare all documents and identify discrepancies, missing data, and verifications across the entire document set.

CRITICAL COMPARISONS TO PERFORM:
1. Consignor/Consignee names and addresses - must match across all documents
2. Total values - must match (e.g., Commercial Invoice grand total vs Export Permit total value)
3. Quantities - must match across documents
4. HS Codes, Permit numbers, PO numbers - must be consistent
5. Shipping marks, origin/destination - must align
6. Document dates - check for logical sequence

OUTPUT FORMAT - CRITICAL: You MUST create a separate section for EACH document listed below:
{documentList}

For EACH document above, create a section in this EXACT format:

## {firstDocumentName}

### ❌ Critical Issues - Must Fix
- Use format: "Mismatch: <field> — ''<value_in_this_doc>'' vs ''<value_in_other_doc>'' in [Other Document Name]"
- Use format: "Missing: <required field> — not found in this document"
- If none, write "None identified."

### ⚠️ Warnings & Recommendations
- Use format: "Minor inconsistency: <field> — <brief description>"
- Use format: "Verified: <field> — ''<value>'' consistent across all documents"
- If none, write "None identified."

REPEAT THE ABOVE SECTION FORMAT FOR EACH DOCUMENT.

IMPORTANT RULES:
- You MUST create separate ## sections for ALL {documentCount} documents
- Each section must start with EXACTLY: ## [Document Name]
- Perform all verifications yourself using the extracted data above
- Do NOT tell the user to cross-check anything
- Be specific about which documents have discrepancies
- Keep bullets SHORT and actionable
- No long paragraphs or prose
- DO NOT combine multiple documents into one section',
  '[
    "Consignor and Consignee information must match across all documents",
    "Total values must be consistent between documents",
    "Quantities must match across all documents",
    "HS Codes and Permit numbers must be valid and consistent",
    "Shipping marks must align across documents",
    "Origin and destination information must be consistent"
  ]'::jsonb,
  true
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM document_comparison_rules 
  WHERE name = 'Standard Export Verification'
)
LIMIT 1;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_document_comparison_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_document_comparison_rules_updated_at ON document_comparison_rules;
CREATE TRIGGER update_document_comparison_rules_updated_at
  BEFORE UPDATE ON document_comparison_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_document_comparison_rules_updated_at();

-- Grant permissions (if needed)
GRANT ALL ON document_comparison_rules TO authenticated;

