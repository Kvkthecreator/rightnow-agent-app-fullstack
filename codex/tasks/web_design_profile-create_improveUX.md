## codex/tasks/web_design_profile-create_improveUX.md

Use my design system exactly as follows:
[Paste your theme guide here, or reference above]

**Task:**  
Refactor `/profile-create` page to improve UX by:

1. **Adding a progress bar stepper** above the Card, replacing the plain “Step X of 3” text. The progress bar should:
    - Use 3 labeled steps, with the current step highlighted using the primary color from theme
    - Bar fills as user advances
    - Fully responsive and styled only with theme-approved classes

2. **Implementing a reusable loading state** after clicking “Generate Report”:
    - When user clicks Generate Report, show a Card-based loading overlay or spinner using theme classes
    - Display a message like “Generating your report…” centered in the Card
    - Button(s) should be disabled during loading
    - Component should be reusable for other async flows in the app

**Guidelines:**
- Use only theme variables (see theme guide), not Tailwind default palette or hardcoded colors
- Components (progress bar, loading state) should be reusable and placed in `/components` if possible
- All cards, buttons, inputs must follow border radius, shadow, and spacing rules from theme guide
- No inline hex codes or non-theme classes
- Use shadcn/ui and Lucide icons where appropriate
- The rest of the multi-step wizard/form structure should remain as-is, just visually upgraded

**Optional:**  
- Add subtle animation to progress bar fill (if easy within theme constraints)
- Show different loading messages if progress can be estimated (optional, not required)

