## codex/tasks/landing_page_refactor.md

📄 Task Title

Build Landing Page for Creator Starter Kit

🎯 Goal

Implement a clean, mobile-responsive landing page introducing the “Creator Starter Kit,” including:

🎯 Hero section with marketing message, CTA buttons, and subtext
🧭 Features section explaining what the user receives in their personalized kit
✅ Tailwind utility classes for styling
🔁 Reusable component for individual feature cards
🦶 Simple footer with branding
This task implements the frontend index.tsx page of the Next.js app.

🧠 Prompt to Codex

Build a responsive landing page in React using Tailwind CSS to introduce the “Creator Starter Kit” product. The page should include:

1. A Hero Section with:
   - Main headline: “🎯 Your Creator Starter Kit is Ready”
   - Supporting text about finding niche, tone, audience
   - Two call-to-action buttons: “Create Your Profile” and “Get My Starter Kit” (linked to /profile-create)
   - Subtext: “No fluff. No signup wall...”

2. A Features Section:
   - Title: “🧭 What You'll Get”
   - 6 feature cards showing what’s included in the report
   - Each card should be a reusable `FeatureCard` component

3. A Footer:
   - Minimal text: “© {year} rightNOW. Personalized strategy for aspiring creators.”

Code should be placed in `web/app/index/page.tsx`.

Use semantic HTML structure and Tailwind classes (rounded-2xl, bg-gray-50, px-6, etc.) to ensure mobile-friendly design.

This reflects the official launch messaging and report structure from the GTM brief.
