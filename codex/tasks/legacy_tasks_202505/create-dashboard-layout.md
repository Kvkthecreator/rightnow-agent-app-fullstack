## 📄 Task Title
Establish Base Dashboard Layout Using `shadcn/ui` Block

## 🎯 Goal
Implement the `dashboard-01` block from `shadcn/ui` as the **foundational layout** across all authenticated pages, ensuring clean modularization, minimal override bugs, and full Vercel build compatibility.

This layout should:
- Provide a left sidebar navigation and top header as global UI scaffolding
- Be **conditionally excluded** on unauthenticated or special pages (e.g., landing page)
- Be composable and override-friendly for nested routes

## 🧠 Prompt to Codex

Set up the following architecture based on the current project root and folder structure (`/web/app` and `/web/components`).

### 1. Preflight (Assume):
- Working in branch: `feature/dashboard-layout`
- Project already uses App Router (Next.js 15.3.2)
- TailwindCSS + shadcn/ui installed and configured
- `cn()` utility already available from `lib/utils.ts`

### 2. Create Layout Shell Components

#### `/web/components/layouts/DashboardLayout.tsx`
Use this as the main wrapper. Implement the layout from `npx shadcn@latest add dashboard-01`, but structure the component to:
- Accept `children` as prop
- Use responsive sidebar with nav icons + active state logic
- Extract nav links array into a local constant
- Use `shadcn/ui` primitives (`Sheet`, `Button`, `ScrollArea`, etc.)

#### `/web/components/layouts/DashboardNav.tsx`
Extract sidebar nav + mobile sheet toggle into a reusable nav component.

#### `/web/components/layouts/DashboardHeader.tsx`
Top-level header bar (optional) that handles breadcrumbs, profile avatar, etc.

### 3. Refactor `app/layout.tsx`
Wrap the root layout in logic to determine whether the dashboard shell should be rendered. Sample logic:
```ts
const authPages = ["/login", "/signup", "/"];
const isAuthPage = authPages.includes(params.pathname);
return isAuthPage ? <>{children}</> : <DashboardLayout>{children}</DashboardLayout>;
```

> ⚠️ Ensure this check works with nested routes like `/demo/profile-preview`, possibly using `pathname.startsWith()` or a regex.

### 4. Adjust `/app/demo/page.tsx` and `/app/demo/profile-preview/page.tsx`
Refactor both pages so that they render as children within the dashboard layout.
Ensure:
- They do **not** import layout wrappers themselves
- Their UI assumes dashboard shell exists above

### 5. Final Touches
- Sidebar links should have working `href` (e.g., `/demo`, `/profile`, etc.)
- Mark current route as active
- Sidebar should scroll if too long (e.g., add `ScrollArea`)

---

## ✅ Success Criteria
- Global layout uses `dashboard-01` block UI
- All authenticated pages are wrapped with the layout
- Unauthenticated pages render without sidebar
- Works on `vercel build` without type or module errors

## 🛌 Branch
`feature/dashboard-layout`

## ✅ Completed Log

- [x] Created layout components: DashboardNav, DashboardHeader, DashboardLayout
- [x] Applied only to `/demo*` routes using `usePathname()`
- [x] Verified deployment on Vercel preview
- [x] Confirmed separation of layout for unauthenticated pages (`/`)
