## codex/tasks/design_profilepage_shacdn.md

🪄 Codex Task: Apply shadcn/ui Design & Layouts to Profile-Create Wizard

### Task: Refactor `/profile-create` Wizard to Use shadcn/ui Design System

#### Goal
Update the pages:
- `web/app/profile-create/page.tsx`
- `web/app/profile/page.tsx`
and, if necessary, any related components under:
- `web/components/profile-create/`

Apply your existing **shadcn/ui design layouts** and component styles, matching the look and feel already present on `/demo` and across your app.

#### Instructions

- Replace all standard HTML elements (inputs, buttons, progress bars, cards, headings, etc.) in the profile-create wizard with their `shadcn/ui` equivalents.
    - Use shadcn components such as: `Card`, `CardContent`, `Button`, `Input`, `Label`, `Progress`, `Tabs`, etc.
    - Apply your theme’s spacing, font sizes, and color utilities (as seen on `/demo`).
- Ensure the **page container, padding, breakpoints, and general layout** match `/demo` and other shadcn-themed pages.
- Use the same card/grid structure for the wizard steps as in `/demo` (or any base layout/section wrappers you use globally).
- For multi-step navigation and transitions, use shadcn’s `Tabs` if appropriate, or replicate the transitions/styles from `/demo`.
- All action buttons (Next, Back, Generate) should use the shadcn `Button` component with consistent variants (e.g., `variant="default"`, `variant="outline"`).
- Progress indicator should use the shadcn `Progress` component or a custom stepper styled in the shadcn way.
- Where possible, **centralize theme variables** and style via your global Tailwind config (so the wizard inherits base colors, radii, fonts, etc.).
- **Mobile/responsive**: Layout and spacing must be responsive, matching `/demo`.
- Remove any legacy or non-shadcn inline styles.
- Preview the final result to ensure UI consistency across `/profile-create` and `/demo`.

**Tip for Codex:**  
Reference your `/demo` page and any global layout/utility files to maintain consistency.

#### Files to update:
- `web/app/profile-create/page.tsx`
- Any relevant files under `web/components/profile-create/` if new components are needed.

#### Notes:
- Do **not** break the step-by-step logic or lose form state management.
- Do **not** alter API integration.
- Only change structure, markup, and styling to use shadcn/ui layouts.
- Export a default React component as before.