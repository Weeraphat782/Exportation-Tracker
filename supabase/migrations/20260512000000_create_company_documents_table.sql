-- Company-level persistent documents
-- Stores reusable company documents (TK11, TK10, ID Card, Thai GACP)
-- that auto-link to new quotations instead of requiring re-upload each time.
-- Uses user_id (from profiles) so no company record is required.

-- Drop previous version if it exists (schema change: company_id → user_id)
DROP TABLE IF EXISTS company_documents;

CREATE TABLE company_documents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type     TEXT        NOT NULL,
  document_type_name TEXT       NOT NULL,
  file_path         TEXT        NOT NULL,
  file_name         TEXT        NOT NULL,
  storage_provider  TEXT        NOT NULL DEFAULT 'r2',
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_type)
);

CREATE INDEX idx_company_documents_user_id ON company_documents(user_id);

ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_own_company_documents"
  ON company_documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "customers_insert_own_company_documents"
  ON company_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_update_own_company_documents"
  ON company_documents FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "customers_delete_own_company_documents"
  ON company_documents FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "staff_select_all_company_documents"
  ON company_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

ALTER TABLE document_submissions
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT NULL;
