## 📄 Task Title
refactor_shacdn_designlayout_refactor.md

---

## 🎯 Goal
Finalize the design shell by aligning sidebar, header, user dropdown placement, and hover states to match the full `shadcn/ui` dashboard reference. Lay the groundwork for reuse in future SaaS projects and profile expansion.

---

## 🧠 Prompt to Codex
```
Refine the Shadcn-style dashboard layout to fully align with the reference shell design, including sidebar bottom user info and nav interactions.

### Goal:
Ensure sidebar, topnav, and layout match the reference visually and interactively.

### Changes to Apply:

1. **User Info Placement**:
   - Move the `UserNav` (with avatar, email, logout) from the top-right header to the **bottom-left of the sidebar**, just like the shadcn reference.
   - Replace current sidebar placeholder (if any) with actual `UserNav` component.

2. **SidebarNav.tsx**:
   - Add visual feedback for:
     - **Active page**: background + text color (e.g. `bg-muted text-foreground`)
     - **Hover state**: light highlight (e.g. `hover:bg-muted transition`)
   - Ensure consistent layout and icon spacing.

3. **MainNav.tsx**:
   - Remove user email display from top nav.
   - Keep `rgtNOW` branding left-aligned.
   - Optionally reserve space for future actions (e.g., notifications).

4. **Shell.tsx**:
   - Ensure flex structure allocates correct space for sidebar and content (`min-h-screen`, `grid-cols-[240px_1fr]`, etc.).
   - Wrap main content in `main className="p-6"` with proper background.

5. **Clean-up**:
   - Ensure `/profile` and `/demo` pages don’t introduce duplicate padding or wrappers.
   - Remove unused imports or dead layout code.

### Styling:
- All buttons, text, and icons follow shadcn UI primitives.
- Sidebar bottom section matches the reference image, with avatar + user email + ellipsis icon.
```

---

## ✅ Completion Checklist
- [ ] Sidebar user info appears at bottom, not header
- [ ] Nav active/hover states match Shadcn UX
- [ ] MainNav only includes app name and optional action slots
- [ ] Shell layout uses consistent spacing and minimal wrappers
- [ ] `/demo` and `/profile` pages rely fully on Shell layout
- [ ] Code is modular, clean, and Vercel deployable

