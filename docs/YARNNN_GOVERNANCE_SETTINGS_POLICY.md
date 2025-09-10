# Governance Settings Policy — Canon-Safe Implementation

Status: Authoritative Implementation Note (2025-09-08)

## Purpose
Prevent configuration drift and UX ambiguity by documenting the canon‑safe subset of governance controls exposed in the product.

## Canon Principles (recap)
- P0 Capture is sacred and immediate: writes `raw_dumps`, no interpretation.
- Substrate mutations (P1/P2) are governed via proposals (CreateBlock, CreateContextItem, Revise/Merge, relationships).
- Artifacts (P3/P4) are separate from substrate; no governance flags apply to artifacts.

## Product Controls (Simplified)

Visible (plain language):
- Governance: on/off (default: on)
- Review Mode: 
  - Review everything (Proposal)
  - Smart review (Hybrid) — lets Yarnnn auto‑approve small, safe changes
- Always run validator: on/off 
  - When on, proposals cannot be auto‑approved
- Change scope (default reach): Local (basket) or Scoped (workspace)

Fixed (canon):
- Capture (P0) is always immediate (Direct)
- Timeline Restore always requires review (Proposal)
- Direct substrate writes are disabled globally
- Artifact entry points (documents/reflections) are out of scope

## Server Enforcement
- Role: owner/admin may update. (Owners are canonical admins.)
- Coercions:
  - `ep_onboarding_dump` = `direct`.
  - `timeline_restore` = `proposal`.
  - Review Mode controls `manual_edit` + `graph_action` together: `proposal` or `hybrid`.
  - `direct` is not allowed for `manual_edit`/`graph_action`.
  - `default_blast_radius`: coerce `Global` → `Scoped`.
  - `direct_substrate_writes` → `false`.

## Defaults
- When settings are absent:
  - `onboarding_dump='direct'`, `manual_edit='proposal'`, `graph_action='proposal'`, `timeline_restore='proposal'`, `default_blast_radius='Scoped'`.
  - Matches `public.get_workspace_governance_flags()` fallback.

## Rationale
- Keeps capture immediate to preserve P0→P1 pipeline, eliminates ‘Capture’ proposals.
- Preserves governance for substrate evolution where it matters.
- Prevents artifact/substrate conflation and dangerous bypasses.

## Acceptance
- UI: minimal controls; Action policies hidden under Advanced and read-only; copy uses plain language.
- API: enforces canon (P0 direct, timeline restore proposal, no artifact toggles, no direct substrate writes).

## Auto‑Approve Policy (Agents)
- Agents may auto‑approve only when:
  - Governance is enabled, and Review Mode is Smart (Hybrid)
  - Validator is not required
  - Proposal is small/clean (confidence high, no warnings, bounded ops)
- Otherwise proposals are created in PROPOSED state for human review.
