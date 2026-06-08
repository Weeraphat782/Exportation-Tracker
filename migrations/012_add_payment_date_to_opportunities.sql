-- Date the customer paid (nullable = pending payment)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS payment_date DATE;
