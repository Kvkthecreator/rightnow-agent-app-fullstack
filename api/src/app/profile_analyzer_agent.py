from agents import Agent, output_guardrail, GuardrailFunctionOutput
from typing import List, Optional
from typing_extensions import TypedDict

class CreatorStarterKitReport(TypedDict, total=False):
    suggested_niches: List[str]
    audience_persona: str
    content_strengths: List[str]
    platform_fit: List[str]
    starting_content_ideas: List[str]
    growth_readiness_note: str

class ProfileAnalyzerOut(TypedDict):
    type: str
    output_type: str
    report: CreatorStarterKitReport
    report_markdown: str

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
    output_type=ProfileAnalyzerOut,
)