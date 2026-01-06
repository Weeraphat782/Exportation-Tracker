-- Add approval-related columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS registration_docs JSONB;

-- Create an index on onboarding_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_companies_onboarding_token ON companies(onboarding_token);

-- Update existing companies to have a token if they don't have one (though gen_random_uuid() handles it for new ones)
-- This ensures all existing companies get a token upon migration
UPDATE companies SET onboarding_token = gen_random_uuid() WHERE onboarding_token IS NULL;
