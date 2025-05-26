## codex/tasks/agent_rewire_profile_analyzer_agent.md

# Codex Task: Finalize and Wire Up Profile Analyzer Agent

## Goal
- Wire up the `/profile_analyzer` endpoint so it accepts a POST payload matching the Jamie test profile.
- Ensure the endpoint calls `profile_analyzer_agent` with the input and returns its output *as JSON*.
- Add/confirm any Pydantic models if needed for input/output typing.
- Return the agent's output directly—no extra wrapping, no markdown.

## Steps
1. In `api/src/app/profile_analyzer_agent.py`, ensure a Pydantic input model (e.g. `ProfileAnalyzerInput`) matches this shape:
    {
      "profile": {
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
      "user_id": "jamie-test-user",
      "task_id": "jamie-test-task"
    }

2. Add or update the `/profile_analyzer` POST endpoint in FastAPI (api/src/app/profile_analyzer_agent.py or agent_server.py):
    - Parse the payload into the input model.
    - Pass the data to `profile_analyzer_agent`.
    - Return the agent's output directly.

3. Add error handling: if the agent throws or the output doesn’t match schema, return 422/500 with error.

4. (Optional) If `profile_analyzer_agent` needs changes to input/output signature, update accordingly.

## Output
- The `/profile_analyzer` POST endpoint returns a strict JSON matching your ProfileAnalyzerOut schema.
- Jamie-test frontend can POST to `http://localhost:10000/profile_analyzer` and render the markdown using the output.

## Testing
- Share a sample Postman payload for quick testing:

POST http://localhost:10000/profile_analyzer
Content-Type: application/json

{
  "profile": {
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
  "user_id": "jamie-test-user",
  "task_id": "jamie-test-task"
}

Return the full JSON agent output as the response.
