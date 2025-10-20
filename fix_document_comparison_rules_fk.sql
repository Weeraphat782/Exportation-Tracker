-- Drop existing foreign key constraint
ALTER TABLE document_comparison_rules 
DROP CONSTRAINT IF EXISTS document_comparison_rules_user_id_fkey;

-- Add new foreign key constraint referencing auth.users instead
ALTER TABLE document_comparison_rules 
ADD CONSTRAINT document_comparison_rules_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


