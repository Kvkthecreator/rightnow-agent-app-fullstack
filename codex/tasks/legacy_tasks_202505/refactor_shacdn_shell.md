## 📄 Task Title
Refactor Dashboard Layout to Use Shadcn Shell Components

---

## 🎯 Goal
Align the current `/demo` page and layout with the full `shadcn/ui` dashboard shell pattern, ensuring:
- Sidebar navigation is modular and expandable
- Header contains title, user dropdown, and optional actions
- Layout is easily reusable for future authenticated pages

---

## 🧠 Prompt to Codex
```
Migrate the current dashboard layout in a Next.js 15.3 App Router + Tailwind project to match the official `shadcn/ui` dashboard shell pattern.

Use the following structure:

1. Create `components/layouts/Shell.tsx`:
   - Accepts `children`
   - Renders top `MainNav`, side `SidebarNav`, and content area

2. Create `components/layouts/MainNav.tsx`:
   - Contains `rgtNOW` app title (left-aligned)
   - Right-aligned `UserNav` (replaces inline user email button)

3. Create `components/layouts/SidebarNav.tsx`:
   - Contains vertical nav with icons (e.g., Home, Profile)
   - Accept list of items with `href`, `title`, `icon`

4. Update `components/UserDropdown.tsx` (rename `UserNav.tsx`) to match shadcn style

5. Update `app/(dashboard)/layout.tsx` to wrap all dashboard pages in `Shell`

6. Update `/app/demo/page.tsx`:
   - Remove local layout code (headers, wrappers)
   - Render only `DemoCard` and `FormDemo` inside the Shell

Design Notes:
- Use spacing/padding like `p-6` for main content
- Use `Lucide` icons for nav
- All components styled with Tailwind + shadcn primitives
```

---

## ✅ Completion Checklist
- [ ] Shell layout and navigation are modularized
- [ ] `/demo` uses the shared Shell layout
- [ ] Sidebar and top nav resemble reference design
- [ ] User dropdown (logout) is functional and styled
- [ ] Vercel deployment success
- [ ] Ready for snapshot as a reusable boilerplate base

Let me know when ready to proceed to the next feature group (e.g. sidebar collapsibility, profile setup, or campaign workflow).
