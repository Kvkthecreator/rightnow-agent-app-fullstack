## codex/tasks/web_design_profile_profilecreate_upd.md
Codex Clarification for web_design_profile_profilecreate_upd.md

Design Details to Update:
Apply full dashboard/app layout:
/profile-create and /profile should inherit the same sidebar nav, header, and main content wrapper as /dashboard.
No more standalone floating forms—integrate with the main shell/layout component.
Use only variable-based classes:
No use of Tailwind’s default palette classes (bg-white, etc.)—only CSS variable-based classes as detailed in the Theme Guide. All colors, borders, backgrounds, and radii must use theme classes.
Card and Button conventions:
All main content blocks (forms, summary cards) should use the Card convention: bg-card rounded-2xl shadow-sm p-6.
All buttons must be styled: bg-primary text-primary-foreground rounded-lg px-4 py-2 font-semibold.
Inputs and forms:
Inputs: bg-input border border-border text-foreground rounded-lg shadow-sm p-3.
Layout: flex flex-col gap-6 or grid gap-6 for form groups.
Typography and spacing:
Headings: text-xl font-semibold
Body text: text-base
Muted/step text: text-sm text-muted-foreground
Section/card padding: p-6 or p-10
No new sidebar or chart colors beyond what’s in the theme guide. Use existing variable names.
New/Updated Component Guidelines:
Progress Bar Stepper:
Replace “Step X of 3” text with a visual progress bar (stepper), using only theme classes and components. Must be responsive and reusable.
Loading State Component:
After “Generate Report” is clicked, show a Card-based loading indicator (using theme colors/shadows/typography), disable the button, and display a clear status message (“Generating your report…”).
This component should be reusable for other async actions.
General:
All new/reworked components should be placed in /web/components/ for reuse.
Do not rewrite the Theme Guide section—just use it as the ruleset.
All changes are downstream of the theme guide—not rewriting the guide itself.
No theme variable changes needed—use what’s in the current Theme Guide (web/styles/theme-guide.md).
No new sidebar, nav, or chart colors—just consistent application of what’s documented.
Summary:
Refactor /profile-create and /profile to use the full dashboard/app layout with sidebar/header.
Use only variable-based theme classes for all color, spacing, radii.
Upgrade progress steps to a progress bar/stepper.
Add a reusable, Card-based loading state for report generation (and future async needs).
No new theme variables or colors—just stricter enforcement of existing guide.