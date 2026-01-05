-- Add opportunity_id to quotations table
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotations_opportunity_id ON public.quotations(opportunity_id);

-- Update RLS policies for Quotations to allow public insert/update similar to Opportunities (for dev)
-- (Assuming user wants same ease of use for now)
-- Drop the specific policy we are about to create to avoid conflicts (idempotency)
DROP POLICY IF EXISTS "quotations_policy_public" ON quotations;

CREATE POLICY "quotations_policy_public" ON quotations
  FOR ALL TO public USING (true);
