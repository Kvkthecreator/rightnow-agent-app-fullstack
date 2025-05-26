## 📄 Task Title

Initialize Theme Configuration (Tailwind + shadcn/ui)

## 🎯 Goal

Create a baseline theme configuration that reflects the design system used in shadcn/ui examples and our internal design guide.

This theme should:

* Establish consistent styling for spacing, rounding, colors, shadows, and typography
* Align visually with: [https://ui.shadcn.com](https://ui.shadcn.com) and screenshot provided in `/styles/theme-guide.md`
* Set a foundation to be referenced in all future Codex tasks

## 🧠 Prompt to Codex

### 1. Tailwind Theme Setup

Update `tailwind.config.js` to:

* Enable dark mode via `class`

* Extend `theme` with:

  * **Border Radius Tokens**:

    * `sm`: 6px
    * `md`: 8px
    * `lg`: 12px (Default UI — `rounded-lg`)
    * `xl`: 16px
    * `2xl`: 24px (for cards/modals)

  * **Font Family**:

    * `sans`: \["Inter", "sans-serif"]

  * **Container**:

    * `center: true`
    * `padding: 2rem`

* Register paths for Tailwind’s purge:

  ```js
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ]
  ```

* Include `tailwindcss-animate` plugin

---

### 2. Create Design Reference

Ensure `/styles/theme-guide.md` contains the following design tokens:

#### Border Radius

| Token | Radius | Usage                     |
| ----- | ------ | ------------------------- |
| sm    | 6px    | Tags, badges              |
| md    | 8px    | Small inputs              |
| lg    | 12px   | Default — buttons, inputs |
| xl    | 16px   | Sections                  |
| 2xl   | 24px   | Cards, modals             |

#### Colors

* Primary: `violet-600` (light), `violet-400` (hover)
* Backgrounds: `white` (light), `gray-950` (dark)
* Borders: `gray-200` (light), `gray-800` (dark)
* Text:

  * Headings: `slate-900` (light), `slate-100` (dark)
  * Body: `slate-700` / `slate-400`
  * Muted: `text-muted-foreground` where applicable

#### Shadows

* `shadow-sm`: inputs, buttons, cards
* `shadow-md`: modals

#### Typography

* Font: `Inter`, sans-serif
* Sizes:

  * Headings: `text-xl font-semibold`
  * Body: `text-base`
  * Captions: `text-sm text-muted-foreground`

#### Spacing & Layout

* Section padding: `p-6`, `md:p-10`
* Form spacing: `space-y-4`, `gap-6`

---

### 3. Component Example Verification

Ensure `Button.tsx` and `Card.tsx` use:

* `rounded-lg` or `rounded-2xl`
* Tailwind spacing from guide
* Text tokens like `text-sm`, `font-medium`
* Color classes mapped to primary/secondary from guide

---

## ✅ Success Criteria

* `tailwind.config.js` is updated with correct design tokens
* `/styles/theme-guide.md` is complete and referenced for styling consistency
* All future components and Codex tasks refer to this design foundation
