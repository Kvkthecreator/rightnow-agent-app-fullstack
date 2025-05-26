📄 Task Title

refactor_shadcn_shell_final_pass.md

🎯 Goal

Finalize and polish the Shadcn-based Shell layout by implementing sidebar responsiveness, relocating the user menu to the sidebar footer, and ensuring the UI mimics the reference dashboard pixel-for-pixel.

🧠 Prompt to Codex

Refactor the current layout shell to match the official shadcn/ui dashboard structure and responsiveness.

### ✅ Required Functional + Visual Changes

1. **Sidebar Toggle (Collapse Button)**
   - Place a collapsible toggle at the **top-left corner**, before the app title (`rgtNOW`)
   - Use the **sidebar toggle icon** shown in the reference screenshot (☰ style, from Lucide)
   - Add a **vertical separator** (`border-r`, `px-2`) between the icon and app title

2. **Responsive Sidebar Logic**
   - Implement sidebar with `collapsible="offcanvas"` behavior
   - If `window.innerWidth < 768px` (or use Tailwind's `md:` breakpoint), auto-collapse the sidebar
   - Sidebar should **push content** on large screens and **slide over** on small screens

3. **User Menu Placement**
   - Move user email block with icon + `...` menu to **sidebar footer**
   - Remove from header (top right) entirely
   - Ensure layout matches spacing in the reference
   - Component: `UserNav.tsx` → render it in `SidebarFooter`

4. **Shell Grid Layout**
   - Ensure Shell uses:
     - `min-h-screen grid grid-cols-[240px_1fr]`
     - Sidebar spans full height, not cut off
   - Wrap page content inside `main className="p-6"`

5. **Nav States**
   - Sidebar items (`SidebarNav.tsx`) should:
     - Show active state (`bg-muted font-medium text-foreground`)
     - Support hover (`hover:bg-muted transition-colors`)
     - Use consistent icon/text spacing

6. **SidebarNav Structure**
   - Use `SidebarHeader`, `SidebarContent`, `SidebarFooter` structure
   - Group navigation blocks (e.g., Demo/Profile | Docs | Secondary nav) using built-in `SidebarMenu` components
   - Use actual Shadcn layout components (`Sidebar`, `SidebarMenuItem`, `SidebarMenuButton`) to avoid HTML custom styling

7. **Cleanup**
   - Remove dead layout logic from root `/layout.tsx`
   - Ensure `/demo` and `/profile` pages only render `<Shell>` content
   - Verify layout scales and resets on window resize

### Notes:
- Use Lucide icons from `lucide-react`
- Sidebar toggle button must **work** and match visuals
- Header is **just** the app name and optional button slot
✅ Completion Checklist

 Sidebar toggle button present and styled correctly
 Sidebar auto-collapses on small screens
 Sidebar spans full height and has offcanvas logic
 User info (email + icon) moved to sidebar bottom
 Main layout grid is min-h-screen and correctly structured
 No layout wrappers remain in /demo or /profile
 Ready to snapshot this version for boilerplate cloning