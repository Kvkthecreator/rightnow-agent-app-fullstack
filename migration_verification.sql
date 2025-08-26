-- Verification queries to run after applying the migration
-- Run these queries to confirm the migration was successful

-- 1. Test the verification function
SELECT * FROM verify_canon_compatibility();

-- 2. Check that timeline_events table exists with correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'timeline_events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Test emit_timeline_event function with a sample call (replace with real basket_id)
-- SELECT emit_timeline_event(
--   'your-basket-id-here'::uuid,
--   'document.created',
--   '{"title": "Test Document", "ref_id": "test-doc-id"}'::jsonb,
--   'your-workspace-id-here'::uuid,
--   auth.uid()
-- );

-- 4. Check constraint allows new event types
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'timeline_events_kind_check';

-- 5. Verify existing timeline_events data is intact
SELECT COUNT(*) as total_events, 
       COUNT(DISTINCT kind) as unique_kinds,
       MIN(ts) as oldest_event,
       MAX(ts) as newest_event
FROM timeline_events;

-- 6. Show sample of existing event kinds
SELECT kind, COUNT(*) as count
FROM timeline_events 
GROUP BY kind 
ORDER BY count DESC
LIMIT 10;

-- 7. Test that documents table still works (content_rendered should still exist)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'documents' AND column_name = 'content_rendered';