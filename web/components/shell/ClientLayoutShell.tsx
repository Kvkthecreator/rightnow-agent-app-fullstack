"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/app/components/shell/Sidebar";
import TopBar from "@/components/common/TopBar";
import type { ReactNode } from "react";

// These routes will show the sidebar in addition to /baskets routes
const SHOW_SIDEBAR_ROUTES = [
  "/home",
  "/dashboard",
  "/blocks",
  "/context",
  "/create",
];

// Deep routes where the sidebar should remain hidden
const HIDE_SIDEBAR_PATTERNS = [/^\/baskets\/[^/]+\/documents\/[^/]+\/work/];

// Determine if sidebar should be shown for the current pathname
const shouldShowSidebarForPath = (pathname: string | null): boolean => {
  if (!pathname) return false;

  // Hide on explicit disallowed patterns
  if (HIDE_SIDEBAR_PATTERNS.some((re) => re.test(pathname))) return false;

  // Always show on any /baskets route (list + basket work pages)
  if (pathname.startsWith("/baskets")) return true;

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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
