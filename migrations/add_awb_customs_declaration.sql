-- Add AWB (Air Waybill) and Customs Declaration fields to quotations table
-- These documents are uploaded by staff after all customer documents are processed,
-- just before shipping. They are displayed on the Customer Portal shipment tracking page.

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS awb_file_url TEXT,
  ADD COLUMN IF NOT EXISTS awb_file_name TEXT,
  ADD COLUMN IF NOT EXISTS awb_uploaded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS customs_declaration_file_url TEXT,
  ADD COLUMN IF NOT EXISTS customs_declaration_file_name TEXT,
  ADD COLUMN IF NOT EXISTS customs_declaration_uploaded_at TIMESTAMP WITH TIME ZONE;
