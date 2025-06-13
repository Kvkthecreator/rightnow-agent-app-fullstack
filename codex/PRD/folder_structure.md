.venvmacbook@maegbug-ui-MacBookPro rightnow-agent-app-fullstack % tree -L 3 -I "node_modules|.git|__pycache__|.venv"

.
├── =1.66.5
├── =2.10,
├── api
│   ├── __init__.py
│   ├── build.sh
│   ├── README.md
│   └── src
│       ├── __init__.py
│       ├── app
│       ├── core
│       ├── requirements.txt
│       ├── schemas.py
│       └── scripts
├── codex
│   ├── codex_usage.md
│   ├── codex_workflow_guide.md
│   ├── PRD
│   │   ├── 20250528_newarchitecture.md
│   │   ├── agent_flows.md
│   │   ├── architecture
│   │   ├── frontend_contracts
│   │   ├── README.md
│   │   ├── requirements.md
│   │   ├── supabaseDB_schema.md
│   │   ├── task_types
│   │   └── user_flows
│   ├── sessions
│   │   ├── auth-session-redirect.md
│   │   ├── create-dashboard-layout-session
│   │   ├── init-theme-config-session.md
│   │   └── refactor_homepage_hero_and_layout-session.md
│   └── tasks
│       ├── 02050528_architecture_PRD_read.md
│       ├── 0531_context2_blockspagecompbuild.md
│       ├── 0531_context2_codexinspect.md
│       ├── 0531_context2_legacyreferenceupd.md
│       ├── 20240527_refactor_manager_agent.md
│       ├── 20250526_add_competitor_task_type.md
│       ├── 20250526_fix_reportid_route_param_type.md
│       ├── 20250526_fix_reportid_route.md
│       ├── 20250526_fix_single_report_route.md
│       ├── 20250526_frontend-tasktypei+chatflowblending.md
│       ├── 20250526_manager_refactor_roadmap.md
│       ├── 20250526_manager_tasktype_field_tracking.md
│       ├── 20250526_normaiilize.report_output.md
│       ├── 20250526_patch_apiget_error_handling.md
│       ├── 20250526_reportsdebug.md
│       ├── 20250527_agententrypointrefactor.md
│       ├── 20250527_chatupdate.md
│       ├── 20250527_clarification_ui_response_flow.md
│       ├── diagnose_batch1_codextasks.md
│       ├── diagnose_prd_drift.md
│       ├── enable_profile_logo_upload.md
│       ├── enable_supabase_file_uploads.md
│       ├── enable_task_brief_endpoints.md
│       ├── ensure_profile_core_fetch.md
│       ├── fix_upload_typing_and_add_buttons.md
│       ├── legacy_tasks_202505
│       ├── profile_refactor.md
│       ├── task_task-brief_refactor.md
│       ├── TEMP_designsystem template
│       ├── TEMP_task_template
│       ├── TEMPLATE: figma HTLM -> next+tailwind components
│       └── ui_task_brief_form.md
├── docs
│   ├── agents.md
│   ├── assets
│   │   ├── images
│   │   └── logo.svg
│   ├── config.md
│   ├── context.md
│   ├── examples.md
│   ├── guardrails.md
│   ├── handoffs.md
│   ├── index.md
│   ├── ja
│   │   ├── agents.md
│   │   ├── config.md
│   │   ├── context.md
│   │   ├── examples.md
│   │   ├── guardrails.md
│   │   ├── handoffs.md
│   │   ├── index.md
│   │   ├── mcp.md
│   │   ├── models.md
│   │   ├── multi_agent.md
│   │   ├── quickstart.md
│   │   ├── results.md
│   │   ├── running_agents.md
│   │   ├── streaming.md
│   │   ├── tools.md
│   │   ├── tracing.md
│   │   ├── visualization.md
│   │   └── voice
│   ├── mcp.md
│   ├── models.md
│   ├── multi_agent.md
│   ├── quickstart.md
│   ├── ref
│   │   ├── agent_output.md
│   │   ├── agent.md
│   │   ├── exceptions.md
│   │   ├── extensions
│   │   ├── function_schema.md
│   │   ├── guardrail.md
│   │   ├── handoffs.md
│   │   ├── index.md
│   │   ├── items.md
│   │   ├── lifecycle.md
│   │   ├── mcp
│   │   ├── model_settings.md
│   │   ├── models
│   │   ├── result.md
│   │   ├── run_context.md
│   │   ├── run.md
│   │   ├── stream_events.md
│   │   ├── tool.md
│   │   ├── tracing
│   │   ├── usage.md
│   │   └── voice
│   ├── results.md
│   ├── running_agents.md
│   ├── scripts
│   │   └── translate_docs.py
│   ├── streaming.md
│   ├── stylesheets
│   │   └── extra.css
│   ├── tools.md
│   ├── tracing.md
│   ├── visualization.md
│   └── voice
│       ├── pipeline.md
│       ├── quickstart.md
│       └── tracing.md
├── examples
│   ├── __init__.py
│   ├── agent_patterns
│   │   ├── agents_as_tools.py
│   │   ├── deterministic.py
│   │   ├── forcing_tool_use.py
│   │   ├── input_guardrails.py
│   │   ├── llm_as_a_judge.py
│   │   ├── output_guardrails.py
│   │   ├── parallelization.py
│   │   ├── README.md
│   │   └── routing.py
│   ├── basic
│   │   ├── agent_lifecycle_example.py
│   │   ├── dynamic_system_prompt.py
│   │   ├── hello_world_jupyter.py
│   │   ├── hello_world.py
│   │   ├── lifecycle_example.py
│   │   ├── stream_items.py
│   │   ├── stream_text.py
│   │   └── tools.py
│   ├── customer_service
│   │   └── main.py
│   ├── financial_research_agent
│   │   ├── __init__.py
│   │   ├── agents
│   │   ├── main.py
│   │   ├── manager.py
│   │   ├── printer.py
│   │   └── README.md
│   ├── handoffs
│   │   ├── message_filter_streaming.py
│   │   └── message_filter.py
│   ├── mcp
│   │   ├── filesystem_example
│   │   ├── git_example
│   │   └── sse_example
│   ├── model_providers
│   │   ├── custom_example_agent.py
│   │   ├── custom_example_global.py
│   │   ├── custom_example_provider.py
│   │   └── README.md
│   ├── research_bot
│   │   ├── __init__.py
│   │   ├── agents
│   │   ├── main.py
│   │   ├── manager.py
│   │   ├── printer.py
│   │   ├── README.md
│   │   └── sample_outputs
│   ├── tools
│   │   ├── computer_use.py
│   │   ├── file_search.py
│   │   └── web_search.py
│   └── voice
│       ├── __init__.py
│       ├── static
│       └── streamed
├── LICENSE
├── Makefile
├── mkdocs.yml
├── poetry.lock
├── pyproject.toml
├── README.md
├── render.yaml
├── start-dev.sh
├── supabase
│   ├── config.toml
│   └── migrations
│       ├── 20250514095800_create_profiles.sql
│       ├── 20250514095801_create_profile_report_sections.sql
│       ├── 20250514111003_add_sns_url_to_profiles.sql
│       ├── 20250519120000_update_profiles_schema.sql
│       └── 20250528_create_task_briefs.sql
├── tests
│   ├── __init__.py
│   ├── conftest.py
│   ├── fake_model.py
│   ├── mcp
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── helpers.py
│   │   ├── test_caching.py
│   │   ├── test_connect_disconnect.py
│   │   ├── test_mcp_tracing.py
│   │   ├── test_mcp_util.py
│   │   ├── test_runner_calls_mcp.py
│   │   └── test_server_errors.py
│   ├── README.md
│   ├── test_agent_config.py
│   ├── test_agent_hooks.py
│   ├── test_agent_runner_streamed.py
│   ├── test_agent_runner.py
│   ├── test_agent_tracing.py
│   ├── test_computer_action.py
│   ├── test_config.py
│   ├── test_doc_parsing.py
│   ├── test_extension_filters.py
│   ├── test_function_schema.py
│   ├── test_function_tool_decorator.py
│   ├── test_function_tool.py
│   ├── test_global_hooks.py
│   ├── test_guardrails.py
│   ├── test_handoff_tool.py
│   ├── test_items_helpers.py
│   ├── test_max_turns.py
│   ├── test_openai_chatcompletions_converter.py
│   ├── test_openai_chatcompletions_stream.py
│   ├── test_openai_chatcompletions.py
│   ├── test_openai_responses_converter.py
│   ├── test_output_tool.py
│   ├── test_pretty_print.py
│   ├── test_responses_tracing.py
│   ├── test_responses.py
│   ├── test_result_cast.py
│   ├── test_run_config.py
│   ├── test_run_step_execution.py
│   ├── test_run_step_processing.py
│   ├── test_strict_schema.py
│   ├── test_tool_choice_reset.py
│   ├── test_tool_converter.py
│   ├── test_tool_use_behavior.py
│   ├── test_trace_processor.py
│   ├── test_tracing_errors_streamed.py
│   ├── test_tracing_errors.py
│   ├── test_tracing.py
│   ├── test_visualization.py
│   ├── testing_processor.py
│   ├── tracing
│   │   └── test_processor_api_key.py
│   └── voice
│       ├── __init__.py
│       ├── conftest.py
│       ├── fake_models.py
│       ├── helpers.py
│       ├── test_input.py
│       ├── test_openai_stt.py
│       ├── test_openai_tts.py
│       ├── test_pipeline.py
│       └── test_workflow.py
├── uv.lock
└── web
    ├── app
    │   ├── about
    │   ├── api
    │   ├── auth
    │   ├── blocks
    │   ├── briefs
    │   ├── creations
    │   ├── dashboard
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── login
    │   ├── page.tsx
    │   ├── privacy
    │   ├── profile
    │   ├── tasks
    │   └── terms
    ├── components
    │   ├── BackgroundPaths.tsx
    │   ├── blocks
    │   ├── Breadcrumb.tsx
    │   ├── ChatPane.tsx
    │   ├── ClarificationResponse.tsx
    │   ├── Footer.tsx
    │   ├── forms
    │   ├── Header.tsx
    │   ├── InputInline.tsx
    │   ├── landing
    │   ├── layouts
    │   ├── library
    │   ├── Logo.tsx
    │   ├── profile-create
    │   ├── ProfileInsightReport.tsx
    │   ├── SupabaseProvider.tsx
    │   ├── TaskBriefForm.tsx
    │   ├── TaskCard.tsx
    │   ├── TaskForm.tsx
    │   ├── TextareaInline.tsx
    │   ├── ui
    │   └── UserNav.tsx
    ├── components.json
    ├── globals.d.ts
    ├── hooks
    │   └── useTaskTypes.ts
    ├── layouts
    │   └── default.tsx
    ├── lib
    │   ├── api.ts
    │   ├── briefs.ts
    │   ├── insertBlockFile.ts
    │   ├── insertUserFile.ts
    │   ├── supabase
    │   ├── supabaseClient.ts
    │   ├── supabaseServerClient.ts
    │   ├── types.ts
    │   ├── uploadFile.ts
    │   ├── useAuth.ts
    │   └── utils.ts
    ├── middleware.ts
    ├── next-env.d.ts
    ├── next.config.ts
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── public
    │   └── assets
    ├── README.md
    ├── styles
    │   └── theme-guide.md
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── tsconfig.tsbuildinfo