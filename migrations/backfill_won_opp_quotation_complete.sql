-- Backfill: mark linked quotations as 'completed' for opportunities already marked Won
--
-- Context:
--   Win Case handler now cascades to linked quotations (sets status='completed'),
--   but older won opportunities were marked before that change shipped.
--   This script catches up the existing data once.
--
-- Rules:
--   - Only touch quotations linked to opportunities where closure_status = 'won'
--   - Skip quotations already 'rejected' (explicit losses)
--   - Skip quotations already 'completed' (idempotent)
--
-- Safe to run multiple times.

UPDATE quotations q
SET
    status = 'completed',
    updated_at = NOW()
FROM opportunities o
WHERE q.opportunity_id = o.id
  AND o.closure_status = 'won'
  AND q.status <> 'rejected'
  AND q.status <> 'completed';

-- Optional: see how many rows were updated
-- (Postgres returns the count via the client; no SELECT needed here.)
