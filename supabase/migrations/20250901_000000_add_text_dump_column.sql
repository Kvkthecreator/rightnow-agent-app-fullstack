-- Add text_dump column to raw_dumps table for backend compatibility
-- Backend agent service expects text_dump column but frontend uses body_md

-- Add text_dump column as alias/copy of body_md
ALTER TABLE public.raw_dumps 
ADD COLUMN IF NOT EXISTS text_dump text;

-- Copy existing body_md values to text_dump for backwards compatibility
UPDATE public.raw_dumps 
SET text_dump = body_md 
WHERE text_dump IS NULL AND body_md IS NOT NULL;

-- Create trigger to sync body_md and text_dump columns
CREATE OR REPLACE FUNCTION sync_raw_dump_text_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- When body_md is updated, sync to text_dump
  IF NEW.body_md IS DISTINCT FROM OLD.body_md THEN
    NEW.text_dump = NEW.body_md;
  END IF;
  
  -- When text_dump is updated, sync to body_md  
  IF NEW.text_dump IS DISTINCT FROM OLD.text_dump THEN
    NEW.body_md = NEW.text_dump;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep columns in sync
DROP TRIGGER IF EXISTS sync_text_dump_columns ON public.raw_dumps;
CREATE TRIGGER sync_text_dump_columns
  BEFORE UPDATE ON public.raw_dumps
  FOR EACH ROW
  EXECUTE FUNCTION sync_raw_dump_text_columns();

-- Create trigger for inserts to ensure both columns are populated
CREATE OR REPLACE FUNCTION ensure_raw_dump_text_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure both columns have the same value on insert
  IF NEW.body_md IS NOT NULL AND NEW.text_dump IS NULL THEN
    NEW.text_dump = NEW.body_md;
  ELSIF NEW.text_dump IS NOT NULL AND NEW.body_md IS NULL THEN
    NEW.body_md = NEW.text_dump;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_text_dump_columns ON public.raw_dumps;
CREATE TRIGGER ensure_text_dump_columns
  BEFORE INSERT ON public.raw_dumps
  FOR EACH ROW
  EXECUTE FUNCTION ensure_raw_dump_text_columns();

-- Add comment explaining the dual column approach
COMMENT ON COLUMN public.raw_dumps.text_dump IS 'Backend compatibility column - synced with body_md';
COMMENT ON COLUMN public.raw_dumps.body_md IS 'Frontend primary column - synced with text_dump';