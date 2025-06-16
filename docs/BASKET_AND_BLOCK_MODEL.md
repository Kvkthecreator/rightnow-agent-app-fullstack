# BASKET_AND_BLOCK_MODEL.md

Yarnnn Canonical Model — Basket, Block, and Their Interactions

🎯 Purpose

This document defines the canonical structure, types, statuses, and relationships of baskets and blocks in Yarnnn.
It provides the foundation for architecture, implementation, and agent orchestration logic.

All design, code, and PRs must align to this model unless superseded by formal revision.

🟣 Basket

What is a basket?
A basket is the container and workspace representing a single cohesive user intent submission and its evolving context.
It persists over time and houses all related content, structure, and metadata.
Basket core fields
Field	Type	Purpose
id	uuid	Unique basket ID
user_id	uuid	Owner of the basket
name	string (optional)	User-specified basket name
raw_dump	text	The initial user submission (Domain 1 dump)
status	enum (draft, in_progress, complete, archived)	Lifecycle state
tags	string[]	Global metadata tags (e.g. “brand: Yummy”)
commentary	text (optional)	Basket-level notes (agent/user-generated)
Basket status lifecycle
Status	Meaning
draft	Initial state, not yet enriched
in_progress	Active enrichment, block editing ongoing
complete	Basket finalized (all blocks approved/locked)
archived	No longer active, for reference
🟣 Block

What is a block?
A block is a modular content, structure, or context unit that composes part of a basket’s narrative or metadata.
Block core fields
Field	Type	Purpose
id	uuid	Unique block ID
basket_id	uuid	Associated basket
type	enum (content, metadata, commentary)	Block category
content	text	Main text content (Markdown preserved)
status	enum (proposed, approved, rejected, locked)	Block lifecycle state
order	int (nullable)	Position in narrative (if content type)
meta_tags	string[] (optional)	Tags for block (e.g. “brand_name”, “tagline”)
origin	string (optional)	Source (agent name, manual, user)
Block types
Type	Purpose	Rendered in narrative?
content	Narrative chunk	✅ Yes
metadata	Structural or referential info (e.g. brand name, intent)	❌ No
commentary	Notes about content (agent/user generated)	❌ No
Block status lifecycle
Status	Meaning
proposed	Suggested by agent or user, pending approval
approved	User accepted, included in narrative
rejected	User declined
locked	Frozen from further changes
🟣 Relationships and flow

👉 Baskets contain many blocks.
👉 Basket status can be influenced by block statuses (e.g. a basket is complete only when all narrative blocks are approved or locked).
👉 Commentary can exist at both basket level (global note) and block level (specific feedback or recommendations).
👉 Agents propose new blocks, edits, tags → these feed into the change queue for approval.

🟣 Example create vs modify flow

Step	Basket Create	Basket Modify
Input	Raw dump + files	Edits to existing text, new input
Agent	Bulk blockify proposal	Incremental proposals (diff-based)
User	Approves/rejects initial blocks	Approves/rejects incremental proposals
Status flow	draft → in_progress	Stays in_progress or moves to complete as appropriate
🟣 Design rules

✅ Baskets are the whole; blocks are the parts
✅ Metadata belongs at the level it describes:

Basket tags for global context
Block meta_tags for specific pieces of content
✅ Blockify = agent proposes structure, user confirms
✅ Narrative is assembled from approved/locked content blocks in order
🟣 Usage

This file defines the baseline model for baskets and blocks in Yarnnn.
Changes require architectural review and update to this doc.