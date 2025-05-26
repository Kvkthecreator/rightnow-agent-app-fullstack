# 🧠 Codex Task: Add Sidebar Collapsibility

## 📄 Task Title
Add collapsible sidebar functionality to the Shell layout.

## 🎯 Goal
Allow users on desktop view to collapse and expand the sidebar:
- Collapsed: narrow width showing only icons only.
- Expanded: full width with icons and labels.
- Toggle control visible in header next to the logo.
- Preserve current mobile layout behavior (always expanded).

## 🧠 Prompt to Codex
```
Implement desktop sidebar collapsibility for the Shell layout in web/components/layouts:

1. In `Shell.tsx`, manage a boolean `collapsed` state via React `useState`.
2. Pass `collapsed` and `onCollapseToggle` props to `SidebarNav` and `MainNav`.
3. Modify `SidebarNav.tsx` to apply conditional width classes:
   - `w-20` when collapsed.
   - `w-64` when expanded.
   - Hide nav item text when collapsed; only render icons.
4. Update `MainNav.tsx` to accept `collapsed` and `onCollapseToggle` props:
   - Render a toggle button (ChevronLeft/ChevronRight) on md+ screens.
5. Ensure smooth width transitions using Tailwind classes (`transition-all duration-200`).

Do not introduce additional context providers; a simple stateful toggle is sufficient.
```

## 🗂 Context
- Files: `web/components/layouts/Shell.tsx`, `SidebarNav.tsx`, `MainNav.tsx`
- Utilize React `useState` in `Shell.tsx` to track collapse state.

## 🛠 Status
- [ ] Not started

## 🔗 Related Branch
```bash
git checkout -b feature/add-sidebar-collapsibility
```

## 🔗CODEX REPLY manual update
 codex
    I’ve updated the task spec and implemented a simple desktop-sidebar collapse/expand flow in the Shell layout:

    • codex/tasks/add_sidebar_collapsibility.md
      – Added a full task description targeting Shell.tsx, SidebarNav.tsx, and MainNav.tsx.

    • web/components/layouts/Shell.tsx
      – Imported useState and track a new collapsed boolean.
      – Pass collapsed and onCollapseToggle into SidebarNav and MainNav.

    • web/components/layouts/SidebarNav.tsx
      – Added a collapsed prop.
      – Conditionally apply w-20 (collapsed) vs. w-64 (expanded), hide text labels when collapsed, and animate width via Tailwind.

    • web/components/layouts/MainNav.tsx
      – Now accepts collapsed and onCollapseToggle.
      – Renders a desktop-only toggle button (ChevronLeft/ChevronRight) next to the logo.

    Let me know if you’d like any tweaks to the UX or behavior!
╭────────────────────────────────────────────────────────────────────