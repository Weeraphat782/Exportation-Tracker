-- Add price_confirmed column to quotations table
-- When false, client portal shows "Waiting for price confirmation - price might be changed"
-- Staff confirms via button on opportunity kanban card
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS price_confirmed BOOLEAN DEFAULT false;
