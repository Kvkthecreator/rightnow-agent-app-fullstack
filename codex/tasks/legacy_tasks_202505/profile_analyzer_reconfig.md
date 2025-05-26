## codex/tasks/profile_analyzer_reconfig.md

Update the `profile_analyzer_agent` as follows:

1. **Web Search Integration**
    - Use the `WebSearchTool()` from the agents SDK.
    - Always attempt at least one relevant web search using the user's profile info and locale (e.g., search for best practices, trending strategies, or cultural nuances for that region).

2. **Locale Awareness**
    - Adapt tone, examples, and references to the user's `locale` (country/language).
    - Output language should match locale if possible.

3. **Output Structure**
    - The output should be a JSON object:
        {
            "type": "structured",
            "summary": "<one-line, personalized summary>",
            "readiness_rating": {
                "score": 1-5,
                "reason": "<short explanation>"
            },
            "cta": "<short, actionable CTA for the user>",
            "sections": [
                {
                    "title": "<section title>",
                    "content": "<rich text or markdown, explain rationale, give actionable advice>",
                    "source_links": ["<list of URLs used for insights, if any>"]
                },
                ...
            ]
        }

4. **Section Ideas**
    - Niche/Audience fit analysis
    - Content style and channel recommendations
    - Local trends & culture-specific tips (from web search)
    - Growth plan (week 1-2 suggestions)
    - Pitfalls to avoid
    - Resources (link to 1-2 relevant guides, local communities, etc.)

5. **Quality Bar**
    - Output must be value-add, not generic. Each section should give *new* or *tailored* advice.
    - Always cite 1-2 reputable sources from the search (unless user is in a locale where search is not available).

6. **Final Touches**
    - If possible, explain which advice was drawn from live search vs. generic knowledge.
    - For non-English locales, provide English summary at the bottom if feasible.

7. **Testing**
    - Deploy this to the `/jamie-test` page and review the report output for various locales and profiles.

Log all reasoning and changes in codex/sessions/profile-analyzer-upgrade.md.
