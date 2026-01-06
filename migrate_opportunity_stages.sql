-- Migration script to update existing opportunities to the new stage naming convention (FINAL: 10 Stages)
UPDATE opportunities SET stage = 'inquiry' WHERE stage = 'prospecting';
UPDATE opportunities SET stage = 'quoting' WHERE stage = 'qualification';
UPDATE opportunities SET stage = 'pending_docs' WHERE stage = 'proposal';
UPDATE opportunities SET stage = 'pending_booking' WHERE stage = 'negotiation';

-- Refinement: 'payment_received' instead of 'pending_payment'
UPDATE opportunities SET stage = 'payment_received' WHERE stage = 'pending_payment';

-- Status cleanup
UPDATE opportunities SET stage = 'awb_received' WHERE stage = 'waiting_awb';
