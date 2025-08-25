-- Fix packing list number generation to avoid duplicates under RLS

-- 1) Create counters table (no RLS) to track per-year running numbers
CREATE TABLE IF NOT EXISTS packing_list_counters (
  year TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Disable RLS for internal counter table
ALTER TABLE packing_list_counters DISABLE ROW LEVEL SECURITY;

-- 2) Replace generator function to use counters table atomically
CREATE OR REPLACE FUNCTION generate_packing_list_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  next_number INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  WITH upsert AS (
    INSERT INTO packing_list_counters(year, last_number)
    VALUES (year_part, 1)
    ON CONFLICT (year)
    DO UPDATE SET last_number = packing_list_counters.last_number + 1,
                  updated_at = now()
    RETURNING last_number
  )
  SELECT last_number INTO next_number FROM upsert;

  NEW.packing_list_no := 'PL-' || year_part || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS set_packing_list_number ON packing_lists;
CREATE TRIGGER set_packing_list_number
BEFORE INSERT ON packing_lists
FOR EACH ROW
WHEN (NEW.packing_list_no IS NULL OR NEW.packing_list_no = '')
EXECUTE FUNCTION generate_packing_list_number();


