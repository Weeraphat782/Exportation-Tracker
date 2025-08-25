-- Ensure created_by is automatically set from the authenticated user

CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger idempotently
DROP TRIGGER IF EXISTS trg_set_created_by ON packing_lists;
CREATE TRIGGER trg_set_created_by
BEFORE INSERT ON packing_lists
FOR EACH ROW
EXECUTE FUNCTION set_created_by();


