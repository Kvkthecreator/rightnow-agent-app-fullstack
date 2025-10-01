# YARNNN Basket Modes Canon

## Purpose
Basket modes ("brains" in the UI) let Yarnnn present different service veneers on top of the same canonical substrate pipelines. A brain re-composes copy, capture prompts, and deliverable emphasis for a basket without mutating how substrate is captured, governed, or stored. Modes give us a clean seam for productized experiences ("Product Brain", "Campaign Brain", etc.) while keeping governance canon-pure.

## Layering
- **Workspace** — tenancy boundary (unchanged).
- **Basket** — the substrate container (P0→P3 capture, governance, documents, graph).
- **Basket Brain / Mode** — a configurable profile layered inside a basket that defines anchors, capture recipes, and deliverable templates. Code keeps the name `basket_mode`; user-facing copy refers to “Product Brain”, “Campaign Brain”, etc.

## Core Principles
- **Substrate is mode-agnostic.** Blocks, context items, dumps, and relationships continue to flow through the same capture (P0/P1) and governance (P2/P3) pipelines regardless of mode.
- **Mode drives framing only.** A mode may change onboarding prompts, dashboards, CTA copy, or surfaced deliverable bundles, but it never bypasses review, overrides policy, or writes bespoke substrate rows.
- **Config over conditionals.** Each mode is a structured configuration file (label, narrative, onboarding steps, deliverable highlights). Frontend surfaces look up config instead of hardcoding branches.
- **Extensible but bounded.** New modes must register in one place, provide copy, and declare expected outputs. Global defaults ensure the app always renders gracefully when an unknown mode is encountered.

## Configuration Contract
- Source files live under `web/basket-modes/` (TypeScript defaults).
- Persisted configurations live in Supabase table `public.basket_mode_configs` so PMs can tweak anchors and prompts without redeploying.
- Each config conforms to `BasketBrainConfig`:
  - **Identity**: `id`, `label`, `tagline`, `description`.
  - **Anchors**: declarative expectations about substrate (`scope: 'core' | 'brain'`, `substrateType`, `criteria`, optional `dependsOn`). Anchors are metadata/tagging only; they do not alter schema.
  - **Capture recipes**: guided ways to create substrate (raw dump prompts, inline block templates, file uploads) with suggested metadata.
  - **Deliverables**: P4 composition templates plus required anchor coverage.
  - **Progress rules**: checklists and thresholds for gating deliverables.
- Core anchors are shared truths (problem, customer, vision, metrics) available to every brain. Brain-specific anchors build on top and may optionally reference core anchors.

### Core Anchor Bootstrap
- New baskets surface a wizard that captures the four core anchors.
- Submission calls `POST /api/baskets/{id}/anchors/bootstrap`, which resolves the authenticated workspace, validates basket ownership, and persists anchors via canon-friendly helpers (`createBlockCanonical`, `createContextItemCanonical`).
- Bootstrap is additive: missing fields are ignored, failures are surfaced in logs, and users can always revise anchors later from Memory.
- Anchor metadata sets `anchor_id`/`anchor_scope` tags only; downstream pipelines continue to govern content normally.

### Anchor Registry
- Runtime configuration lives in Supabase table `public.basket_anchors`. Each row represents the **contract** for an anchor inside a basket (key, label, scope, expected substrate type, required flag, ordering, metadata) and points to the substrate row that currently fulfils it.
- Registry rows are metadata only. The source of truth for anchor content remains governed blocks/context items. Registry updates may only touch descriptive metadata (`label`, `description`, `ordering`, `status`); they never write substrate columns directly.
- Basket mode configs seed the registry: whenever a basket loads its brain config, missing anchor specs are inserted with `scope='core' | 'brain'` and `expected_type` set from the config. Users can create additional `scope='custom'` anchors.
- Anchor lifecycle is derived from governance state:
  - `missing`: no substrate linked yet
  - `draft`: linked substrate exists but is still in proposal/pending state
  - `approved`: linked substrate is ACTIVE/ACCEPTED and fresh
  - `stale`: linked substrate approved but past freshness threshold
  - `archived`: anchor deprecated (registry row marked archived; substrate archived via governance)
- Registry drives stewardship surfaces (Memory view, deliverable gating, notifications) while respecting Sacred Principle #1: all substrate mutations still flow through the Decision Gateway.

### Anchor Stewardship Surface
- `/baskets/[id]/memory` renders mode-aware anchor groups (core + brain) with live status via `GET /api/baskets/{id}/anchors/status`.
- Editors open inline and persist through `POST /api/baskets/{id}/anchors/save`, which reuses canonical helpers (`reviseBlockCanonical`, `createBlockCanonical`, `createContextItemCanonical`) to mutate substrate without bypassing governance.
- Status states are **missing**, **in governance**, **ready** depending on canonical state, keeping UX and governance in lockstep.
- Relationship anchors are displayed as guidance only until substrate support lands.

## Storage Contract
- `public.baskets.mode` records the active mode for a basket.
- Enum values (initial set):
  - `default`
  - `product_brain`
  - `campaign_brain`
- Column defaults to `default` and is required (non-null). Legacy rows backfill to `default` automatically.
- Mode updates travel through the canonical basket API (`PATCH /api/baskets/[id]/mode`). Server validates workspace membership and enum value before updating.
- `public.basket_mode_configs` stores the editable configuration (`mode_id` primary key, `config` JSONB, `updated_at`, `updated_by`). Missing rows fall back to TypeScript defaults at runtime.

## Frontend Consumption
- Basket pages load the active brain config (DB first, fallback to defaults) and pass it into `BasketModeProvider`.
- Shared UI primitives (`ModeOnboardingPanel`, `ModeDeliverablesPanel`) read anchor status and deliverable rules from the config.
- Admin dashboard (`/admin/basket-modes`) lets founders edit the JSON configuration, reset to defaults, and preview anchors/capture recipes.
- Unknown mode IDs gracefully fall back to the default config while logging a warning (dev only).

## Backend Expectations
- REST endpoints that create or return baskets surface the `mode` field. `mode` may be supplied at creation time; if omitted, server applies `default`.
- Configuration API (`/api/admin/basket-modes/configs`) provides authenticated access to the editable JSON payloads.
- Governance services (`BasketManagerService`, template cloning, queue processors) propagate `mode` when cloning or returning basket records but do not branch logic unless an anchor explicitly requires automation.
- Anchors are enforced via metadata checks (during capture validation, reflections, or compose pre-flight), never by bypassing governance.
- Migrations ensure Supabase metadata, RLS policies, and RPCs continue working after the column is added. No policy relaxations are introduced.

## Guardrails for Future Modes
1. **Additive only:** New modes must be additive configs. If a mode requires divergent pipeline behaviour, that change belongs in governance canon, not in the registry.
2. **Documented intent:** Each mode ships with a short canon doc update summarizing purpose, deliverables, and onboarding expectations.
3. **Shared telemetry:** Mode-aware UIs should emit analytics using the mode id so we can measure adoption without coupling logic.
4. **Exit hatch:** Users can switch modes via explicit workspace-scoped APIs. Mode switches should trigger onboarding refresh but never delete substrate.

By keeping the substrate model untouched and routing all experience changes through a typed registry plus a single column on `baskets`, we can iterate on productized experiences quickly without violating canon purity.
