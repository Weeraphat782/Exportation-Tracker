-- Customer-requested flag: wants us to handle phytosanitary certificate
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS phyto_required BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN quotations.phyto_required IS
  'Customer-requested flag: true = customer wants us to handle phytosanitary certificate';
