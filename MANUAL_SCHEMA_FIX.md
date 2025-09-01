# Manual Schema Fix Required

## Issue
Backend agent service is failing with error: `column raw_dumps.text_dump does not exist`

The backend expects `text_dump` column but frontend schema uses `body_md`.

## Fix Required
Execute this SQL directly in Supabase Dashboard → SQL Editor:

```sql
-- Add text_dump column to raw_dumps table for backend compatibility
ALTER TABLE public.raw_dumps ADD COLUMN IF NOT EXISTS text_dump text;

-- Copy existing body_md values to text_dump  
UPDATE public.raw_dumps 
SET text_dump = body_md 
WHERE text_dump IS NULL AND body_md IS NOT NULL;

-- Create sync function
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

-- Create triggers to keep columns in sync
CREATE TRIGGER sync_text_dump_columns
  BEFORE UPDATE ON public.raw_dumps
  FOR EACH ROW
  EXECUTE FUNCTION sync_raw_dump_text_columns();

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

CREATE TRIGGER ensure_text_dump_columns
  BEFORE INSERT ON public.raw_dumps
  FOR EACH ROW
  EXECUTE FUNCTION ensure_raw_dump_text_columns();
```

## Verification
After executing, run this to verify:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'raw_dumps' AND column_name IN ('body_md', 'text_dump');
```

## Next Steps
1. Execute SQL in Supabase Dashboard
2. Update schema_snapshot.sql with new schema
3. Verify backend agent processing resumes