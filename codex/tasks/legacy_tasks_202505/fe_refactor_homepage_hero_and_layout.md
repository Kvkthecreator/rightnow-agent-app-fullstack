## codex/tasks/fe_refactor_homepage_hero_and_layout.md

📄 Codex Task File: refactor_homepage_hero_and_layout.md
# 🧠 Codex Task Template

## 📄 Task Title
Refactor Homepage Hero + Mid-Section Layout Inspired by Frame & Form Site

## 🎯 Goal
Fully redesign the homepage layout to be more structured, visually compelling, and professional. This task includes:
1. Hero section improvements
2. Mid-section stats layout (Frame & Form inspired)
3. Footer redesign

Leverage Tailwind CSS and maintain mobile responsiveness. Use shadcn/ui components where helpful.

## 🧠 Prompt to Codex
```tsx
Update the `/web/app/page.tsx` homepage layout with the following sections:

---

### 1. HERO SECTION
Replace the existing hero with a modern, visually balanced layout.

**Layout:**
- Centered content
- Headline:  
want to be an influencer or content creator?

→ Use `text-5xl sm:text-6xl font-bold text-center leading-tight`

- Subheadline:  
but not sure what’s your niche? or where to start?
get tailor-made report just for you!

→ Use `text-lg text-center text-gray-500 mt-4`

- CTA buttons (side-by-side on desktop, stacked on mobile):
- "Tell me how it works" → `variant="outline"`
- "Create Profile" → `variant="default"`

**Tailwind structure:**
Use flex/column layout, padding `py-24`, and spacing `space-y-6`. Use `shadcn/ui` `Button` if available.

---

### 2. MID-SECTION: VALUE + STATS (Frame & Form Style)

Replace the existing “How it works” and bullet sections.

**Structure:**
Responsive `grid grid-cols-1 md:grid-cols-2 gap-8 py-20 border-t border-b`

**Left Column:**
rightNOW helps creators find their niche,
launch faster, and grow with clarity.

Use `text-2xl font-medium leading-relaxed text-left`

**Right Column:**
- Stat block 1:
  - `1K+` → "Profiles created with our AI"
- Stat block 2:
  - `20+` → "Marketing strategies launched"
- Stat block 3:
  - `50+` → "Creators grew their audience with us"

Each stat should use:
- `text-5xl font-bold` for the number
- `text-sm text-muted-foreground` for the label
- Wrap each in a bordered `div` or visual separator

---

### 3. FOOTER

Create a clean footer with 3-column layout using:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 text-sm border-t">
Left:
Company logo

Center:

CONTACT  
contactus@rgtnow.com
Right:
links for privacy policy and services page
🔧 Requirements
All sections should be mobile responsive (sm, md, lg breakpoints)
Use Tailwind spacing, typography scale, borders
Optional: use shadcn/ui for buttons or layout primitives
Prioritize clarity and visual hierarchy (typographic scale, spacing, borders)
Log decisions and implementation notes in /codex/sessions/refactor_homepage_hero_and_layout-session.md