-- Add is_active column to destinations table
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update RLS policies to ensure user_id is handled (usually already there but good to check)
-- No changes needed to existing policies if they only check user_id.

COMMENT ON COLUMN destinations.is_active IS 'Whether the destination is active and selectable in rates/quotations';
