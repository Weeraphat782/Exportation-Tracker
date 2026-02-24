-- Add requested_destination column to quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS requested_destination TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN quotations.requested_destination IS 'The destination manually entered by the customer when requesting a quote, separate from the official destination mapping.';
