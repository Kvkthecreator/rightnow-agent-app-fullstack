# YARNNN Basket Modes Canon

## Purpose
Basket modes let Yarnnn present different "service veneers" on top of the same canonical substrate pipelines. A mode re-composes copy, onboarding, and deliverable emphasis for a basket without mutating how substrate is captured, governed, or stored. Modes give us a clean seam for productized experiences ("Product Brain", "Campaign Brain", etc.) while keeping governance canon-pure.

## Core Principles
- **Substrate is mode-agnostic.** Blocks, context items, dumps, and relationships continue to flow through the same capture (P0/P1) and governance (P2/P3) pipelines regardless of mode.
- **Mode drives framing only.** A mode may change onboarding prompts, dashboards, CTA copy, or surfaced deliverable bundles, but it never bypasses review, overrides policy, or writes bespoke substrate rows.
- **Config over conditionals.** Each mode is a structured configuration file (label, narrative, onboarding steps, deliverable highlights). Frontend surfaces look up config instead of hardcoding branches.
- **Extensible but bounded.** New modes must register in one place, provide copy, and declare expected outputs. Global defaults ensure the app always renders gracefully when an unknown mode is encountered.

## Mode Registry Contract
- Modes live under `web/basket-modes/` 
  - `index.ts` exports `BASKET_MODES`, `BasketModeId`, and `getModeConfig()`.
  - One file per mode (e.g., `default.ts`, `productBrain.ts`) returns a `BasketModeConfig` structure.
- Required fields:
  - `id` (stable identifier, matches DB enum)
  - `label` and `tagline`
  - `description`
  - `deliverables`: list of highlighted outcomes with copy
  - `onboarding`: ordered steps with CTA metadata, completion guidance
- Optional fields can extend later (e.g., feature flags, suggested agents) but must remain additive.

## Storage Contract
- `public.baskets.mode` records the active mode for a basket.
- Enum values (initial set):
  - `default`
  - `product_brain`
  - `campaign_brain`
- Column defaults to `default` and is required (non-null). Legacy rows backfill to `default` automatically.
- Mode updates travel through the canonical basket API (`PATCH /api/baskets/[id]/mode`). Server validates workspace membership and enum value before updating.

## Frontend Consumption
- `BasketModeProvider` (client context) wraps basket subpages. It receives the DB `mode`, resolves a config with `getModeConfig`, and exposes `useBasketMode()`.
- Shared UI primitives (`ModeOnboardingPanel`, `ModeDeliverablesPanel`) consume the context to render guidance.
- Pages drop in panels where relevant—for example, Memory shows onboarding steps, Documents highlights promised outputs.
- Unknown or future mode IDs gracefully fall back to the default config while logging a warning (dev only).

## Backend Expectations
- REST endpoints that create or return baskets surface the `mode` field. `mode` may be supplied at creation time; if omitted, server applies `default`.
- Governance services (`BasketManagerService`, template cloning, queue processors) propagate `mode` when cloning or returning basket records but do not branch logic on it yet.
- Migrations ensure Supabase metadata, RLS policies, and RPCs continue working after the column is added. No policy relaxations are introduced.

## Guardrails for Future Modes
1. **Additive only:** New modes must be additive configs. If a mode requires divergent pipeline behaviour, that change belongs in governance canon, not in the registry.
2. **Documented intent:** Each mode ships with a short canon doc update summarizing purpose, deliverables, and onboarding expectations.
3. **Shared telemetry:** Mode-aware UIs should emit analytics using the mode id so we can measure adoption without coupling logic.
4. **Exit hatch:** Users can switch modes via explicit workspace-scoped APIs. Mode switches should trigger onboarding refresh but never delete substrate.

By keeping the substrate model untouched and routing all experience changes through a typed registry plus a single column on `baskets`, we can iterate on productized experiences quickly without violating canon purity.
