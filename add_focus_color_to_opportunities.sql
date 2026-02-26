-- Add focus_color column to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS focus_color TEXT;

-- Update RLS if necessary (though existing policies usually cover new columns)
-- Commenting out as the implementation plan didn't specify new policies being needed,
-- but ensures the column exists.
