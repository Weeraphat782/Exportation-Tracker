-- Consignee: party receiving the shipment (distinct from customer_name = our client)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS consignee_name TEXT;
