## codex/tasks/diagnose_batch1_codextasks.md

🔧 Batch 1 Codex Tasks
🧱 Backend

1. Align run_agent responses with PRD contracts
File: api/src/app/agent_entrypoints.py

# Inside run_agent() and run_agent_direct():
# Ensure all responses follow:
{
  "ok": True,
  "task_id": str,
  "agent_type": str,
  "output_type": "structured" | "clarification" | ...,
  "message": dict,  # message_content
  "trace": str | None
}
# Also persist each message into `agent_messages`
2. Delete webhook logic
Delete File: api/src/app/util/webhook.py
Remove Import/Calls: Any send_webhook(...) usage in agent_entrypoints.py

🗂️ Supabase Migrations

3. Create task_briefs table
File: supabase/migrations/20250528_create_task_briefs.sql

create table if not exists task_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  intent text not null,
  sub_instructions text,
  media jsonb,
  core_profile_data jsonb,
  created_at timestamp with time zone default now()
);
4. Create profile_core_data table
File: supabase/migrations/20250528_create_profile_core_data.sql

create table if not exists profile_core_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  display_name text,
  brand_or_company text,
  sns_links jsonb,
  tone_preferences text,
  logo_url text,
  locale text,
  updated_at timestamp with time zone default now()
);
5. Deprecate legacy profile tables
You already dropped them, so no action required here unless you want to mark them explicitly in SQL or a changelog.

💻 Frontend

6. Delete obsolete proxies
web/app/api/openai_chat_response/route.ts → delete
web/app/api/openai_return_output/route.ts → delete
7. Align AgentMessage interface usage
File: web/app/tasks/[taskId]/page.tsx

import type { AgentMessage } from "@/codex/PRD/frontend_contracts/task_contract";

const { data, error } = await supabase
  .from("agent_messages")
  .select("*")
  .eq("task_id", sessionId)
  .order("created_at", { ascending: true });

if (data) {
  setMessages(data as AgentMessage[]);
}
Once these are complete, you'll have a clean slate for TaskBrief-first execution with working agents, type-safe messages, and no webhook noise.