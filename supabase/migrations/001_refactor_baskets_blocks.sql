BEGIN;

-- New enums for canonical model
CREATE TYPE public.basket_status_enum AS ENUM ('draft','in_progress','complete','archived');
CREATE TYPE public.block_status_enum AS ENUM ('proposed','approved','rejected','locked');
CREATE TYPE public.block_type_enum AS ENUM ('content','metadata','commentary');

-- Add new basket columns
ALTER TABLE public.baskets
    ADD COLUMN name text,
    ADD COLUMN tags text[],
    ADD COLUMN commentary text;

-- Convert basket status to enum and set default
ALTER TABLE public.baskets
    ALTER COLUMN status TYPE public.basket_status_enum USING status::public.basket_status_enum,
    ALTER COLUMN status SET DEFAULT 'draft';

-- Drop legacy basket columns
ALTER TABLE public.baskets
    DROP COLUMN IF EXISTS intent,
    DROP COLUMN IF EXISTS sub_instructions,
    DROP COLUMN IF EXISTS media,
    DROP COLUMN IF EXISTS core_profile_data,
    DROP COLUMN IF EXISTS created_at,
    DROP COLUMN IF EXISTS core_context_snapshot,
    DROP COLUMN IF EXISTS is_draft,
    DROP COLUMN IF EXISTS is_published,
    DROP COLUMN IF EXISTS is_locked,
    DROP COLUMN IF EXISTS meta_emotional_tone,
    DROP COLUMN IF EXISTS meta_scope,
    DROP COLUMN IF EXISTS meta_audience,
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS compilation_mode,
    DROP COLUMN IF EXISTS intent_summary;

-- Context blocks adjustments
ALTER TABLE public.context_blocks
    RENAME COLUMN source TO origin;

ALTER TABLE public.context_blocks
    ALTER COLUMN origin TYPE text USING origin::text,
    ALTER COLUMN type TYPE public.block_type_enum USING type::text::public.block_type_enum,
    ALTER COLUMN status TYPE public.block_status_enum USING status::text::public.block_status_enum,
    ALTER COLUMN status SET DEFAULT 'proposed';

ALTER TABLE public.context_blocks
    ADD COLUMN "order" integer;

-- Drop legacy context block columns
ALTER TABLE public.context_blocks
    DROP COLUMN IF EXISTS user_id,
    DROP COLUMN IF EXISTS label,
    DROP COLUMN IF EXISTS version,
    DROP COLUMN IF EXISTS created_at,
    DROP COLUMN IF EXISTS file_ids,
    DROP COLUMN IF EXISTS importance,
    DROP COLUMN IF EXISTS meta_context_scope,
    DROP COLUMN IF EXISTS meta_agent_notes,
    DROP COLUMN IF EXISTS meta_derived_from,
    DROP COLUMN IF EXISTS meta_refreshable,
    DROP COLUMN IF EXISTS meta_embedding,
    DROP COLUMN IF EXISTS meta_locale,
    DROP COLUMN IF EXISTS meta_visibility,
    DROP COLUMN IF EXISTS is_auto_generated,
    DROP COLUMN IF EXISTS requires_user_review,
    DROP COLUMN IF EXISTS last_refreshed_at,
    DROP COLUMN IF EXISTS meta_emotional_tone,
    DROP COLUMN IF EXISTS update_policy,
    DROP COLUMN IF EXISTS feedback_score,
    DROP COLUMN IF EXISTS last_used_successfully_at,
    DROP COLUMN IF EXISTS is_primary,
    DROP COLUMN IF EXISTS parent_block_id,
    DROP COLUMN IF EXISTS artifact_ids,
    DROP COLUMN IF EXISTS group_id,
    DROP COLUMN IF EXISTS tags,
    DROP COLUMN IF EXISTS meta_scope,
    DROP COLUMN IF EXISTS is_draft,
    DROP COLUMN IF EXISTS is_superseded,
    DROP COLUMN IF EXISTS supersedes_block_id,
    DROP COLUMN IF EXISTS commit_id,
    DROP COLUMN IF EXISTS updated_at;

-- Add FK for basket relationship
ALTER TABLE public.context_blocks
    ADD CONSTRAINT context_blocks_basket_id_fkey FOREIGN KEY (basket_id)
        REFERENCES public.baskets(id) ON DELETE CASCADE;

-- Remove legacy table
DROP TABLE IF EXISTS public.block_brief_link CASCADE;

-- Drop unused enums
DROP TYPE IF EXISTS public.context_block_importance_enum;
DROP TYPE IF EXISTS public.context_block_source_enum;
DROP TYPE IF EXISTS public.context_block_status_enum;
DROP TYPE IF EXISTS public.context_block_type_enum;
DROP TYPE IF EXISTS public.context_block_update_policy_enum;

COMMIT;
