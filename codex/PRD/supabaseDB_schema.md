| table_name                    | column_name            | data_type                |
| ----------------------------- | ---------------------- | ------------------------ |
| agent_messages                | id                     | uuid                     |
| agent_messages                | task_id                | text                     |
| agent_messages                | user_id                | uuid                     |
| agent_messages                | agent_type             | text                     |
| agent_messages                | message_type           | text                     |
| agent_messages                | message_content        | jsonb                    |
| agent_messages                | created_at             | timestamp with time zone |
| agent_sessions                | id                     | uuid                     |
| agent_sessions                | user_id                | uuid                     |
| agent_sessions                | agent_type             | text                     |
| agent_sessions                | created_at             | timestamp with time zone |
| agent_sessions                | metadata               | jsonb                    |
| agent_sessions                | inputs                 | jsonb                    |
| agent_sessions                | status                 | text                     |
| agent_sessions                | task_type_id           | text                     |
| block_files                   | id                     | uuid                     |
| block_files                   | user_id                | uuid                     |
| block_files                   | file_url               | text                     |
| block_files                   | file_name              | text                     |
| block_files                   | label                  | text                     |
| block_files                   | note                   | text                     |
| block_files                   | size_bytes             | integer                  |
| block_files                   | created_at             | timestamp with time zone |
| block_files                   | associated_block_id    | uuid                     |
| block_files                   | is_primary             | boolean                  |
| block_usage_history           | id                     | uuid                     |
| block_usage_history           | block_id               | uuid                     |
| block_usage_history           | used_in_task_id        | uuid                     |
| block_usage_history           | used_at                | timestamp with time zone |
| block_usage_history           | agent_type             | text                     |
| block_usage_history           | usage_type             | text                     |
| block_usage_summary           | block_id               | uuid                     |
| block_usage_summary           | last_used_at           | timestamp with time zone |
| block_usage_summary           | total_usages           | bigint                   |
| block_usage_summary           | distinct_tasks         | bigint                   |
| context_blocks                | id                     | uuid                     |
| context_blocks                | user_id                | uuid                     |
| context_blocks                | type                   | USER-DEFINED             |
| context_blocks                | label                  | text                     |
| context_blocks                | content                | text                     |
| context_blocks                | source                 | USER-DEFINED             |
| context_blocks                | version                | integer                  |
| context_blocks                | created_at             | timestamp with time zone |
| context_blocks                | file_ids               | ARRAY                    |
| context_blocks                | status                 | USER-DEFINED             |
| context_blocks                | importance             | USER-DEFINED             |
| context_blocks                | meta_tags              | ARRAY                    |
| context_blocks                | meta_context_scope     | text                     |
| context_blocks                | meta_agent_notes       | text                     |
| context_blocks                | meta_derived_from      | uuid                     |
| context_blocks                | meta_refreshable       | boolean                  |
| context_blocks                | meta_embedding         | USER-DEFINED             |
| context_blocks                | meta_locale            | text                     |
| context_blocks                | meta_visibility        | text                     |
| context_blocks                | is_auto_generated      | boolean                  |
| context_blocks                | requires_user_review   | boolean                  |
| context_blocks                | last_refreshed_at      | timestamp with time zone |
| context_blocks                | meta_emotional_tone    | ARRAY                    |
| deployment_configs            | id                     | uuid                     |
| deployment_configs            | task_brief_id          | uuid                     |
| deployment_configs            | model                  | text                     |
| deployment_configs            | temperature            | double precision         |
| deployment_configs            | max_tokens             | integer                  |
| deployment_configs            | receiver               | text                     |
| deployment_configs            | format                 | text                     |
| deployment_configs            | custom_notes           | text                     |
| deployment_configs            | created_at             | timestamp with time zone |
| profile_core_data             | id                     | uuid                     |
| profile_core_data             | user_id                | uuid                     |
| profile_core_data             | display_name           | text                     |
| profile_core_data             | brand_or_company       | text                     |
| profile_core_data             | sns_links              | jsonb                    |
| profile_core_data             | tone_preferences       | text                     |
| profile_core_data             | logo_url               | text                     |
| profile_core_data             | locale                 | text                     |
| profile_core_data             | updated_at             | timestamp with time zone |
| task_brief_outputs            | id                     | uuid                     |
| task_brief_outputs            | task_brief_id          | uuid                     |
| task_brief_outputs            | config_id              | uuid                     |
| task_brief_outputs            | content                | text                     |
| task_brief_outputs            | output_type            | text                     |
| task_brief_outputs            | agent_type             | text                     |
| task_brief_outputs            | created_at             | timestamp with time zone |
| task_brief_types              | id                     | uuid                     |
| task_brief_types              | title                  | text                     |
| task_brief_types              | description            | text                     |
| task_brief_types              | required_context_types | jsonb                    |
| task_brief_types              | agent_flow             | jsonb                    |
| task_brief_types              | output_type            | text                     |
| task_brief_types              | version                | integer                  |
| task_briefs                   | id                     | uuid                     |
| task_briefs                   | user_id                | uuid                     |
| task_briefs                   | intent                 | text                     |
| task_briefs                   | sub_instructions       | text                     |
| task_briefs                   | media                  | jsonb                    |
| task_briefs                   | core_profile_data      | jsonb                    |
| task_briefs                   | created_at             | timestamp with time zone |
| task_briefs                   | core_context_snapshot  | jsonb                    |
| task_briefs                   | is_draft               | boolean                  |
| task_briefs                   | is_published           | boolean                  |
| task_briefs                   | is_locked              | boolean                  |
| task_briefs                   | meta_emotional_tone    | ARRAY                    |
| task_briefs                   | meta_scope             | text                     |
| task_briefs                   | meta_audience          | text                     |
| task_briefs                   | updated_at             | timestamp with time zone |
| view_block_popularity_by_type | type                   | USER-DEFINED             |
| view_block_popularity_by_type | total_briefs           | bigint                   |
| view_block_popularity_by_type | total_usages           | bigint                   |
| view_block_usage_summary      | block_id               | uuid                     |
| view_block_usage_summary      | user_id                | uuid                     |
| view_block_usage_summary      | label                  | text                     |
| view_block_usage_summary      | brief_count            | bigint                   |
| view_block_usage_summary      | last_used_at           | timestamp with time zone |
| view_block_usage_summary      | usage_modes            | ARRAY                    |
| view_user_brief_patterns      | user_id                | uuid                     |
| view_user_brief_patterns      | total_briefs           | bigint                   |
| view_user_brief_patterns      | dominant_tone          | text                     |
| view_user_brief_patterns      | dominant_scope         | text                     |
| view_user_brief_patterns      | dominant_audience      | text                     |