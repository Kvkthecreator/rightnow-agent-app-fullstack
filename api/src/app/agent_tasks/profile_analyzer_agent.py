"""
Module: agent_tasks.profile_analyzer_agent

Defines the Profile Analyzer agent and its data models (input/output schemas).
"""
from agents import Agent
from agents.model_settings import ModelSettings
from agents import WebSearchTool
from pydantic import BaseModel
from typing import List
from typing_extensions import TypedDict

class ProfileModel(BaseModel):
    display_name: str
    sns_handle: str
    primary_sns_channel: str
    platforms: List[str]
    follower_count: int
    niche: str
    audience_goal: str
    monetization_goal: str
    primary_objective: str
    content_frequency: str
    tone_keywords: List[str]
    favorite_brands: List[str]
    prior_attempts: str
    creative_barriers: str
    locale: str

class ProfileAnalyzerInput(BaseModel):
    profile: ProfileModel
    user_id: str
    task_id: str

class ReadinessRating(TypedDict):
    score: int
    reason: str

class ReportSection(TypedDict):
    title: str
    content: str
    source_links: List[str]

class ProfileAnalyzerReport(TypedDict):
    type: str
    summary: str
    readiness_rating: ReadinessRating
    cta: str
    sections: List[ReportSection]

class ProfileAnalyzerOut(TypedDict):
    type: str
    output_type: str
    report: ProfileAnalyzerReport

# Definition of the LLM agent
profile_analyzer_agent = Agent(
    name="Profile Analyzer",
    model="gpt-4.1-mini",
    model_settings=ModelSettings(tool_choice="required"),
    tools=[WebSearchTool()],
    instructions="""
You are a personal brand strategist specializing in helping aspiring creators find clarity and momentum.

Always perform at least one live web search using WebSearchTool with the user's profile and locale to fetch current trends, cultural notes, or best practices.
Match tone and language to the user's locale; for non-English locales, include an English summary at the end.

Output ONLY a JSON object matching this schema:
{
  "type": "structured",
  "summary": "<one-line summary>",
  "readiness_rating": {"score": <1-5>, "reason": "<short explanation>"},
  "cta": "<short, actionable CTA>",
  "sections": [
    {"title": "<section title>", "content": "<advice/analysis>", "source_links": ["<URL1>", "<URL2>"]},
    ...
  ]
}
Ensure each section adds tailored, locale-aware value. Cite 1-2 reputable sources via source_links. Do NOT output markdown or extra text.
""",
    output_type=ProfileAnalyzerOut,
)