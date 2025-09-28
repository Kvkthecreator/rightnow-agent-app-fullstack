"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/app/components/shell/Sidebar";
import TopBar from "@/components/common/TopBar";
import type { ReactNode } from "react";
import { NavStateProvider } from "@/components/nav/useNavState";

// These routes will show the sidebar in addition to /baskets routes
const SHOW_SIDEBAR_ROUTES = [
  "/home",
  "/dashboard",
  "/blocks",
  "/context",
  "/governance",
];

// Deep routes where the sidebar should remain hidden
const HIDE_SIDEBAR_PATTERNS = [/^\/baskets\/[^/]+\/documents\/[^/]+\/work/];

// Determine if sidebar should be shown for the current pathname
const shouldShowSidebarForPath = (pathname: string | null): boolean => {
  if (!pathname) return false;

  // Hide on explicit disallowed patterns
  if (HIDE_SIDEBAR_PATTERNS.some((re) => re.test(pathname))) return false;

  // Only show on basket-scoped routes (/baskets/:id/...)
  if (/^\/baskets\/[^/]+/.test(pathname)) return true;

  // Show sidebar on other allowed routes
  return SHOW_SIDEBAR_ROUTES.some((route) => pathname.startsWith(route));
};

export default function ClientLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const shouldShowSidebar = shouldShowSidebarForPath(pathname);

  // Removed debug logging to prevent build spam

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  const basketId = pathname?.match(/^\/baskets\/([^/]+)/)?.[1];

  return (
    <NavStateProvider basketId={basketId}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <TopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </NavStateProvider>
  );
}
