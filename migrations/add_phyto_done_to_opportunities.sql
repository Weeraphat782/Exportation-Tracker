-- Mark whether phyto has been completed for an opportunity (Kanban checkbox)
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS phyto_done BOOLEAN NOT NULL DEFAULT false;
