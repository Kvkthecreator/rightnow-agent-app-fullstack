## codex/tasks/supabase_db_profiles_schema_fix.md

Codex Task: Align All Code to the New Profiles Schema

Goal:
Update all profile creation/editing logic and agent input payloads to match the new “profiles” table and enums.

Key Fields:

user_id: string
task_id: string (optional, for tracking)
display_name: string
sns_handle: string
primary_sns_channel: 'instagram' | 'tiktok' | 'youtube' | 'youtube_shorts'
platforms: string[] (freeform, e.g., ['Instagram', 'YouTube Shorts'])
follower_count: integer
niche: string
audience_goal: string
monetization_goal: string
primary_objective: (enum) see above
content_frequency: string
tone_keywords: string[]
favorite_brands: string[]
prior_attempts: string
creative_barriers: string
locale: string
Update the following:

All form fields in /profile-create, /profile, and agent-related code to match the above.
Ensure any payload to /agent or backend matches this structure.
Update all enum references (dropdowns, options, etc.) to use the canonical enum values above.
Test a full create/edit/view flow with a fresh user.
Final “Checklist”
 Apply the SQL above in Supabase SQL editor (confirm table and enums updated).
 Update frontend and backend code to match (run Codex task or do manually).
 Test end-to-end with new user and profile.
 (Optional but recommended) Update any doc/Notion PRD with this final schema.