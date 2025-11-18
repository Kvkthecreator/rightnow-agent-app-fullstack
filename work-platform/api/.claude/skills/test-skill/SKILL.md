---
name: test-skill
description: A minimal test skill to verify Skills loading works
---

# Test Skill

This is a test skill created for Phase 0 of the Claude Agent SDK migration.

## Purpose

If you can read this content, it means:
- Skills are being discovered from the `.claude/skills/` directory
- The "Skill" tool is working correctly
- Skill content is loading into the agent's context

## Test Response

When asked "Can you read the test skill?", you should respond with:

**"Yes, I can read the test skill. Skills loading is working correctly."**

This confirms that the Skill system is functional.

## Phase 0 Context

This Skill is part of Phase 0 testing:
- **Goal**: Prove Claude Agent SDK works in isolation
- **Location**: `work-platform/api/.claude/skills/test-skill/SKILL.md`
- **Documentation**: See `docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md`
