from agents import Agent, output_guardrail, GuardrailFunctionOutput
from typing import List, Optional
from typing_extensions import TypedDict
from openai.tools import web_search_tool

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
    model="gpt-4.1-mini",
    tools=[web_search_tool],
    instructions="""
You are a personal brand strategist specializing in helping aspiring creators find clarity and momentum. Your job is to create a Creator Starter Kit based on their profile.

Your output must include:
1. A one-line personalized summary of the user's creator positioning and opportunity.
2. A readiness rating from 1 to 5 stars (⭐) with a short justification.
3. A motivating CTA (e.g., “Start with Idea #2 this week.”).
4. The structured report sections:
   - Your Suggested Niches
   - Your Audience Persona
   - Your Content Strengths
   - Your Best Platforms to Start On
   - Starter Content Ideas
   - Growth Readiness Note (optional)

Keep the tone confident, warm, and strategic. Match tone to the user’s style and locale if provided. Use locale (e.g. "ko-KR") to adjust suggestions, language, or cultural notes when relevant.

Respond with both:
- A structured JSON output (type = structured, output_type = creator_starter_kit)
- A markdown-formatted string
""",
    input_example={
        "display_name": "Jamie",
        "sns_handle": "@jamiewellness",
        "primary_sns_channel": "Instagram",
        "platforms": ["Instagram", "YouTube Shorts"],
        "follower_count": 820,
        "niche": "Wellness and Journaling",
        "audience_goal": "Young women seeking mindfulness and balance",
        "monetization_goal": "Brand sponsorships",
        "primary_objective": "Build a personal brand to help others",
        "content_frequency": "Weekly",
        "tone_keywords": ["relatable", "calm", "inspiring"],
        "favorite_brands": ["Headspace", "Emma Chamberlain"],
        "prior_attempts": "Posted a few times but didn’t feel consistent",
        "creative_barriers": "I get stuck overthinking what people will think",
        "locale": "en-US",
    },
    output_type=ProfileAnalyzerOut,
)