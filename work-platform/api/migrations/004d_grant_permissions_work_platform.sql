-- Grant permissions to authenticated role for work platform tables
-- Created: 2025-11-06
-- Purpose: Fix missing grants for authenticated users
--
-- Issue: Migration 004c added RLS policies for authenticated role,
-- but forgot to GRANT the necessary table privileges.
-- Result: "permission denied for table" errors despite RLS policies.

BEGIN;

-- =====================================================
-- Grant table privileges to authenticated role
-- =====================================================

-- Projects table
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;

-- Work sessions table
GRANT SELECT, INSERT, UPDATE, DELETE ON work_sessions TO authenticated;

-- Work artifacts table
GRANT SELECT, INSERT, UPDATE, DELETE ON work_artifacts TO authenticated;

-- Work checkpoints table
GRANT SELECT, INSERT, UPDATE, DELETE ON work_checkpoints TO authenticated;

-- =====================================================
-- Grant sequence privileges (for ID generation)
-- =====================================================
-- Note: These tables use gen_random_uuid() so no sequences needed
-- But if we add SERIAL columns later, we'd need:
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;

-- =====================================================
-- Verification Query
-- =====================================================
-- After running, verify with:
--
-- SELECT table_name, grantee, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_schema = 'public'
--   AND table_name IN ('projects', 'work_sessions', 'work_artifacts', 'work_checkpoints')
--   AND grantee = 'authenticated'
-- ORDER BY table_name, privilege_type;
--
-- Expected: 16 rows (4 tables × 4 privileges each)
