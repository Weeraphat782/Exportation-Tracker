-- Add destination_id to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_destination_id ON public.opportunities(destination_id);

-- No RLS update needed if we trust existing public policy from previous step, 
-- but ensuring it's accessible is good practice. The existing TO public policy covers all columns.
