-- 1. Policies for 'companies' table to allow public update via token
-- Drop existing if any to avoid conflicts
DROP POLICY IF EXISTS "Allow public update via onboarding_token" ON companies;

CREATE POLICY "Allow public update via onboarding_token" 
ON companies 
FOR UPDATE 
USING (onboarding_token IS NOT NULL) 
WITH CHECK (onboarding_token IS NOT NULL);

-- 2. Policies for 'storage.objects' to allow public uploads to 'company-documents' bucket
-- Note: Requires the bucket 'company-documents' to exist.
-- If the bucket is not created, the user needs to create it in the Supabase Dashboard first.

-- Allow public uploads
DROP POLICY IF EXISTS "Allow public uploads to company-documents" ON storage.objects;
CREATE POLICY "Allow public uploads to company-documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-documents');

-- Allow public to see their own uploaded docs (optional but helpful for verification)
DROP POLICY IF EXISTS "Allow public to read company-documents" ON storage.objects;
CREATE POLICY "Allow public to read company-documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-documents');
