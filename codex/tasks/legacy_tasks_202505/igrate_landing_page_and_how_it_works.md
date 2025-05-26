migrate_landing_page_and_how_it_works.md
📄 Task Title

Migrate Landing Page & Integrate How It Works Section

🎯 Goal

Rebuild the existing Index and How It Works pages from the Bubble app into a single, clean landing page in the monorepo (/web/app/index/page.tsx) for the rightNOW app.

Ensure:

Only partial visual fidelity is maintained — text content is reused but layout should conform to existing styles in the monorepo.
Merge the “How It Works” content into the landing page via a toggleable section (shown only upon user interaction).
Top nav bar with logo placeholder and “sign-up / login” link is preserved.
Placeholder divs are used for any icons or logos to be updated later.
No button routing logic or click actions are required (visuals only).
🧠 Prompt to Codex

Create a new landing page at: /web/app/index/page.tsx

### General Requirements
- Use existing layout and styling system in the repo (Tailwind + Shell layout if used).
- Responsiveness must be mobile-first.
- No routing logic needs to be implemented for buttons; use href="#" or leave empty.
- Top navigation bar includes:
  - Left: <div className="logo-placeholder" />
  - Right: Sign-up/Login link → href="/sign-up"

### Sections to Include

#### 1. Hero Section
- Headline: "want to be an influencer or content creator?"
- Subheading: "but not sure what's your niche? or where to start?"
- Style text with emphasis and proper heading structure.
- Include CTA buttons (visual only):
  - “tell me how it works” (this toggles the next section)
  - “create profile”

#### 2. “How It Works” Section (Collapsible)
- Initially hidden. Clicking “tell me how it works” reveals this section.
- Include:
  - “how it works...” (title)
  - 3-step flow (Create Profile, Meet Your Agent, Grow with Clarity)
  - Audience types (aspiring influencers, small biz, etc.)
  - Overview of each AI Agent tool (Profile Engine, Strategy Generator, Content Assistant, Repurposing Tool)
  - Comparison chart (“not just another tool”) — can be simplified using check/cross emojis and simple list

#### 3. Footer
- “powered using OpenAI” text
- Two text links:
  - https://www.rgtnow.com/privacy
  - https://www.rgtnow.com/services

### Styling Notes
- Use Tailwind utility classes.
- Use semantic HTML tags (section, h1, h2, ul, etc.).
- Do not mimic Bubble layout styles 1:1 — follow existing monorepo patterns.
- All logos and images can be replaced with:
  - `<div className="logo-placeholder" />`
  - `<div className="image-placeholder" />`
- Keep visual balance and spacing clean, but do not over-engineer interactions.
- No animation libraries or transitions needed.

### Optional
- If helpful, you may split parts of the page into components under `/web/components/`
  - e.g. `HowItWorks.tsx`, `AgentFeature.tsx`, etc.
✅ Completion Checklist

 /index route renders hero + toggleable how-it-works section
 Layout and styling conforms to existing monorepo styles
 Collapsible “How It Works” section works on toggle
 Top nav bar with logo placeholder and sign-up/login link
 CTA buttons are styled but non-functional
 Content is readable, semantic, and responsive
 Visual placeholders used where needed