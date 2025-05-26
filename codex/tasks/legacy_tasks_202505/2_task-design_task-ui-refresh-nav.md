## codex/tasks/2_task-design_task-ui-refresh-nav.md

# Task — UI refresh: global nav & layout

### Context
We introduced `/tasks` and `/reports` pages but the sidebar / mobile
navigation still shows only Dashboard & Profile, so users have no way to
discover the new flow.  
We also want a tiny breadcrumb & active-state styling for consistency.

### Changes
```diff
* web/components/layouts/Sidebar.tsx      ← update items & active class
* web/components/layouts/MobileMenu.tsx   ← same items for mobile
* web/components/layouts/AppShell.tsx     ← inject <Breadcrumb /> in header
+ web/components/Breadcrumb.tsx           ← NEW (reads usePathname)

*** Sidebar / Mobile menu ***

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard", icon: HomeIcon },
  { href: "/tasks",      label: "Tasks",     icon: ClipboardIcon },
  { href: "/reports",    label: "Reports",   icon: BarChartIcon },
  { href: "/profile",    label: "Profile",   icon: UserIcon },
];

Use usePathname() to highlight the current route:
className={cn("px-3 py-2 rounded", pathname.startsWith(href) && "bg-muted")}
Breadcrumb

Displays “Dashboard / …” etc.
Accepts segment array from useSelectedLayoutSegments().
Acceptance
Navigating to each page highlights the correct nav item.
New breadcrumb shows the current path segments.
All pages still compile (npm run build passes).

