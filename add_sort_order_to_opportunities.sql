-- Add sort_order column to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS sort_order FLOAT;

-- Initialize sort_order based on created_at for existing records
WITH OrderedOps AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.opportunities
)
UPDATE public.opportunities
SET sort_order = OrderedOps.row_num
FROM OrderedOps
WHERE public.opportunities.id = OrderedOps.id;
