## codex/tasks/profile_front_testing_jamiepage.md

✅ Codex Task: Live Agent Fetch on /profile/jamie-test

📄 Task Title

Update /profile/jamie-test to dynamically fetch from profile_analyzer_agent

🎯 Goal

Replace the hardcoded jamieProfileOutput object with a real API call to the deployed /agent endpoint. This enables visual validation of the actual agent output in the styled UI layout.

🧠 Prompt to Codex

// 📍 File: web/app/profile/jamie-test/page.tsx

Update the page to fetch real data from the `profile_analyzer_agent`.

Replace the hardcoded `jamieProfileOutput` object with a `useEffect` that:
- Sends a POST request to `/agent` (onRender or localhost, based on env)
- Uses the full `jamie` structured input
- Awaits the response
- Stores the returned `report_markdown` or structured `report` in state

Show:
- A "Loading…" state initially
- The markdown-rendered report once received
- A fallback error message if the request fails

Use this test input (same as before):

```ts
const input = {
  agent_name: "profile_analyzer",
  input: {
    display_name: "Jamie",
    sns_handle: "@jamiewellness",
    primary_sns_channel: "Instagram",
    platforms: ["Instagram", "YouTube Shorts"],
    follower_count: 820,
    niche: "Wellness and Journaling",
    audience_goal: "Young women seeking mindfulness and balance",
    monetization_goal: "Brand sponsorships",
    primary_objective: "Build a personal brand to help others",
    content_frequency: "Weekly",
    tone_keywords: ["relatable", "calm", "inspiring"],
    favorite_brands: ["Headspace", "Emma Chamberlain"],
    prior_attempts: "Posted a few times but didn’t feel consistent",
    creative_barriers: "I get stuck overthinking what people will think",
    locale: "en-US"
  }
};
Use react-markdown to render the report_markdown returned in the agent’s response.

Do not save anything to Supabase or DB yet — this is just for preview.