-- AWB number extracted by Gemini or entered manually / verified by air freight
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS awb_number TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS awb_number_source TEXT;
