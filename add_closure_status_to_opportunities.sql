-- Add closure_status column to opportunities table
-- This allows tracking Won/Lost status separately from the stage
-- A card can be in any stage and still be marked as Won or Lost

-- Add closure_status column
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS closure_status VARCHAR(10) DEFAULT NULL;

-- Add check constraint to ensure valid values
ALTER TABLE opportunities 
ADD CONSTRAINT closure_status_check 
CHECK (closure_status IS NULL OR closure_status IN ('won', 'lost'));

-- Optional: Add closure_date and closure_reason for tracking
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS closure_date TIMESTAMP DEFAULT NULL;

ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS closure_reason TEXT DEFAULT NULL;

-- Create an index for filtering by closure_status
CREATE INDEX IF NOT EXISTS idx_opportunities_closure_status 
ON opportunities(closure_status);

-- Comment for documentation
COMMENT ON COLUMN opportunities.closure_status IS 'Closure status of the opportunity: won, lost, or null for active opportunities';
COMMENT ON COLUMN opportunities.closure_date IS 'Date when the opportunity was closed (won or lost)';
COMMENT ON COLUMN opportunities.closure_reason IS 'Reason for closure or notes about the outcome';


