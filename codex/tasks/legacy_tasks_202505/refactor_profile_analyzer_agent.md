## codex/tasks/refactor_profile_analyzer_agent.md

📄 Task Title

Implement and Test profile_analyzer_agent for Creator Starter Kit Report

🎯 Goal

Define the profile_analyzer_agent in profile_analyzer_agent.py to generate a strategic, motivating report based on a full structured profile. This agent is the core of your “Creator Starter Kit” feature.

🧠 Prompt to Codex

# 📍 File: api/src/app/profile_analyzer_agent.py

from agents import Agent, output_guardrail, GuardrailFunctionOutput  # core agent framework

# 1. Define the output schema inline or import (if agent_output.py has it)
# Example report structure:
# {
#   type: "structured",
#   output_type: "creator_starter_kit",
#   report: {
#     suggested_niches: [...],
#     audience_persona: "...",
#     content_strengths: [...],
#     platform_fit: [...],
#     starting_content_ideas: [...],
#     growth_readiness_note: "..."
#   },
#   report_markdown: "..."
# }

profile_analyzer_agent = Agent(
    name="Profile Analyzer",
    instructions="""
You are a personal brand strategist helping aspiring creators gain clarity. Based on their profile, generate a structured and motivating Creator Starter Kit report. It should feel insightful, scannable, and personalized.

Output both a structured JSON object and a markdown version of the report. Match the following section order:

1. Your Suggested Niches
2. Your Audience Persona
3. Your Content Strengths
4. Your Best Platforms to Start On
5. Starter Content Ideas
6. Growth Readiness Note (optional)

Each section should include 2–3 points or a paragraph. Your tone should be clear, strategic, and encouraging.

Input will be a structured profile dictionary with fields like:
- display_name
- sns_handle
- primary_sns_channel
- niche
- audience_goal
- monetization_goal
- primary_objective
- content_frequency
- platforms
- tone_keywords
- favorite_brands
- prior_attempts
- creative_barriers
""",
)

# Optional: Add tool or output guardrail here (if using JSON structure validator)
🧪 How to Test It

Add a test input manually using the jamie profile (same as Task 1)
Send it via your local /agent endpoint (or CLI run if preferred)
Log or capture the report + report_markdown from response
✅ Deliverables

New agent: profile_analyzer_agent in correct format
Compatible with existing agent_entrypoints.py routing
Produces type: structured, output_type: creator_starter_kit, and full markdown