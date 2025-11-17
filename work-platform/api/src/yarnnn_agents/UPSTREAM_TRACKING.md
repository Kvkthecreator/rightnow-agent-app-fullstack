# Upstream SDK Tracking

This document tracks the relationship between YARNNN's internalized agent framework and Anthropic's official Claude Agent SDK.

## Important Distinction

**This is NOT the official Anthropic Claude Agent SDK.**

The official SDK (`@anthropic-ai/claude-agent-sdk` / `claude-agent-sdk` on PyPI) is a wrapper around Claude Code CLI that provides:
- `query()` function
- `ClaudeSDKClient`
- MCP server integration
- Requires Node.js + Claude Code CLI

**YARNNN's agent framework** (this directory) is based on custom scaffolding that:
- Provides Python-native agent archetypes (ResearchAgent, ContentCreatorAgent, ReportingAgent)
- Uses direct Anthropic API calls via `anthropic` Python package
- Implements MemoryProvider/GovernanceProvider patterns for pluggable backends
- Does NOT require Node.js or Claude Code CLI

## What to Track

### 1. Anthropic Base SDK (`anthropic` Python package)
- **Current version used**: Check `requirements.txt` for `anthropic>=0.40.0`
- **PyPI**: https://pypi.org/project/anthropic/
- **GitHub**: https://github.com/anthropics/anthropic-sdk-python
- **Track for**:
  - New API features (models, parameters, response formats)
  - Breaking changes in message/tool use APIs
  - Performance optimizations

### 2. Official Claude Agent SDK (for reference only)
- **PyPI**: https://pypi.org/project/claude-agent-sdk/
- **GitHub**: https://github.com/anthropics/claude-agent-sdk-python
- **Docs**: https://docs.claude.com/en/docs/agent-sdk/overview
- **Track for**:
  - New architectural patterns we might adopt
  - Session management improvements
  - Hook system enhancements
  - NOT direct code adoption (different architecture)

## Update Procedures

### Upgrading Anthropic Base SDK

1. Check changelog: https://github.com/anthropics/anthropic-sdk-python/blob/main/CHANGELOG.md
2. Test locally:
   ```bash
   pip install anthropic==<new_version>
   python test_research_agent.py
   ```
3. Update `requirements.txt`
4. Verify `base.py` Claude API calls still work
5. Check for new model IDs in archetypes

### Adopting New Patterns from Official Agent SDK

If Anthropic releases features we want to adopt (e.g., better context compaction):

1. Review their implementation: https://github.com/anthropics/claude-agent-sdk-python
2. Adapt to our architecture (direct API, not CLI wrapper)
3. Test with existing MemoryProvider/GovernanceProvider contracts
4. Update this document with what was adopted

### Monitoring for Breaking Changes

Set up periodic checks:
- [ ] Monthly: Check Anthropic SDK releases
- [ ] Quarterly: Review official Agent SDK for new patterns
- [ ] Per-release: Test our archetypes with latest base SDK

## Version History

| Date | Component | Change | Notes |
|------|-----------|--------|-------|
| 2024-11-17 | yarnnn_agents | v1.0.0 Initial internalization | Based on claude-agentsdk-opensource@0b25551 |
| | anthropic | >=0.40.0 | Base SDK version in requirements |

## Files That Use Anthropic SDK Directly

These files call `anthropic.Anthropic()` or use SDK types:
- `base.py` - Core agent reasoning
- `archetypes/research_agent.py` - ResearchAgent execute/deep_dive
- `archetypes/content_creator.py` - ContentCreatorAgent content generation
- `archetypes/reporting_agent.py` - ReportingAgent report generation

When upgrading, test these files first.

## Migration Path (If Needed Later)

If YARNNN decides to adopt the official Anthropic Agent SDK in the future:

1. **Evaluate**: Does it provide value over our custom implementation?
2. **Plan**: Map our MemoryProvider to their context management
3. **Test**: Ensure substrate-api integration still works
4. **Migrate**: Gradually replace archetypes with SDK equivalents
5. **Document**: Update this file with new architecture
