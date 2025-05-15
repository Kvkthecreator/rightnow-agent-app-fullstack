## codex/tasks/build_profile_idpage_testpayload.md

📄 Task Title

Create Static Profile Report Page for Starter Kit Preview

🎯 Goal

Build a new frontend page at /profile/jamie-test that renders the Creator Starter Kit report using a fixed, hardcoded sample payload (jamie). This is used to preview and refine the UX of the final report output, before wiring live agent or DB logic.

🧠 Prompt to Codex

// 📍 File: web/app/profile/[id]/page.tsx

Create a new page at `/profile/jamie-test` that displays a static Creator Starter Kit report using this hardcoded test payload:

```ts
const jamieProfileOutput = {
  type: "structured",
  output_type: "creator_starter_kit",
  report: {
    suggested_niches: ["Wellness journaling", "Mindful productivity"],
    audience_persona: "Young women (ages 18–25) seeking balance in a busy world",
    content_strengths: ["relatable", "calm", "first-person reflections"],
    platform_fit: ["Instagram", "YouTube Shorts"],
    starting_content_ideas: [
      "How I journal when I'm anxious",
      "3 quiet habits that changed my day",
      "What I’d tell my younger self about burnout"
    ],
    growth_readiness_note: "You're deeply thoughtful and aligned with a powerful niche. Just start—your tone is your strength."
  },
  report_markdown: `### Your Suggested Niches  
- Wellness journaling  
- Mindful productivity  

### Your Audience Persona  
Young women (ages 18–25) seeking balance in a busy world  

### Your Content Strengths  
- Relatable  
- Calm  
- First-person reflections  

### Your Best Platforms to Start On  
- Instagram  
- YouTube Shorts  

### Starter Content Ideas  
- How I journal when I'm anxious  
- 3 quiet habits that changed my day  
- What I’d tell my younger self about burnout  

### Growth Readiness Note  
You're deeply thoughtful and aligned with a powerful niche. Just start—your tone is your strength.`
};
Requirements:

Use either markdown rendering (react-markdown) or a clean sectioned card layout using shadcn/ui
Use headers like “Your Suggested Niches”, “Your Audience Persona”, etc. per GTM doc
Place content in a single readable column with generous padding
Ensure it works on both desktop and mobile
This is static-only: no DB, no fetch, no dynamic routing logic
Optional:

Add a dummy "Edit" or "Export" button at the bottom
Comment the file clearly so we can later swap the hardcoded payload with live fetch logic