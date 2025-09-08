# Governance Settings Policy — Canon-Safe Implementation

Status: Authoritative Implementation Note (2025-09-08)

## Purpose
Prevent configuration drift and UX ambiguity by documenting the canon‑safe subset of governance controls exposed in the product.

## Canon Principles (recap)
- P0 Capture is sacred and immediate: writes `raw_dumps`, no interpretation.
- Substrate mutations (P1/P2) are governed via proposals (CreateBlock, CreateContextItem, Revise/Merge, relationships).
- Artifacts (P3/P4) are separate from substrate; no governance flags apply to artifacts.

## Product Controls (Distilled)

Allowed (visible):
- `governance_enabled`: toggle governance framework (default: true).
- `validator_required`: strict vs lenient validator mode for proposals.
- Entry-point policies (substrate only):
  - `onboarding_dump`: fixed to `direct` (non‑editable). Rationale: P0 capture must persist `raw_dumps` and trigger P1.
  - `manual_edit`: `proposal` or `hybrid` (no `direct`).
  - `graph_action`: `proposal` or `hybrid` (no `direct`).
  - `timeline_restore`: fixed to `proposal`.
- `default_blast_radius`: `Local` or `Scoped` only (no `Global`).

Hidden/forced (not user‑configurable):
- `direct_substrate_writes`: always `false`.
- Artifact entry points: `document_edit`, `reflection_suggestion` — removed from UI and API.

## Server Enforcement
- Role: owner/admin may update. (Owners are canonical admins.)
- Coercions:
  - `ep_onboarding_dump` → `direct` unconditionally.
  - `manual_edit`/`graph_action`: reject or coerce `direct` → `proposal`.
  - `timeline_restore` → `proposal`.
  - `default_blast_radius`: coerce `Global` → `Scoped`.
  - `direct_substrate_writes` → `false`.

## Defaults
- When settings are absent:
  - `onboarding_dump='direct'`, others = `proposal`, `default_blast_radius='Scoped'`.
  - Matches `public.get_workspace_governance_flags()` fallback.

## Rationale
- Keeps capture immediate to preserve P0→P1 pipeline, eliminates ‘Capture’ proposals.
- Preserves governance for substrate evolution where it matters.
- Prevents artifact/substrate conflation and dangerous bypasses.

## Acceptance
- UI: settings page hides artifacts, locks P0 to `direct`, prevents `direct` on risky entry points, and hides global blast radius.
- API: ignores/forces restricted fields; accepts owner/admin; returns canon‑safe values.

