## codex/tasks/profile_analyzer_structure_upd.md

✅ Codex Task 2 (coming next): Structural Setup

This will:

Set model to gpt-4.1-mini
Add web_search tool to the agent
Ensure locale and other profile inputs are passed cleanly
Optionally test agent call using a tool-enabled runner
Would you like me to generate Task 2 now?

나의 말:
yes
ChatGPT의 말:
Here’s Codex Task 2: Structural Agent Setup for profile_analyzer_agent, focused on model/tool config and data propagation.

✅ Codex Task 2: Agent Structure Update for Tools + gpt-4.1-mini

📄 Task Title
Update profile_analyzer_agent structure to use GPT-4.1-mini and web_search tool

🎯 Goal

Update the agent configuration so that the profile_analyzer_agent uses:

gpt-4.1-mini as the model
web_search as an enabled tool
Supports passing full structured profile input, including locale, handle, and brand info
This task does not update prompt text — it assumes Task 1 has already done so.
🧠 Prompt to Codex

# 📍 File: api/src/app/profile_analyzer_agent.py

from agents import Agent
from openai.tools import web_search_tool

profile_analyzer_agent = Agent(
    name="Profile Analyzer",
    model="gpt-4.1-mini",  # ✅ Use GPT-4.1-mini model
    tools=[web_search_tool],  # ✅ Use built-in OpenAI web search
    instructions="""
    [Assumes prompt is already updated by Task 1]
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
        "locale": "en-US"
    },
    output_type="structured"
)
✅ Additional Notes
Web search will be used optionally by the model when it believes external context is useful.
Locale (locale) is passed as a field — model should adjust output accordingly.
You may later add tool call logging if needed.
