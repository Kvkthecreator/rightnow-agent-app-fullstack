"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/app/components/shell/Sidebar";
import TopBar from "@/components/common/TopBar";
import { ReactNode } from "react";

// These routes will show sidebar globally
const SHOW_SIDEBAR_ROUTES = [
  "/home",
  "/baskets",
  "/dashboard",
  "/blocks",
  "/context",
];

// These specific routes should NOT show global sidebar (they have custom layouts)
const isBasketWorkPage = (pathname: string | null): boolean => {
  if (!pathname) return false;
  // Match /baskets/[id]/work and all sub-routes
  return pathname.includes('/baskets/') && pathname.includes('/work');
};

export default function ClientLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const isWorkPage = isBasketWorkPage(pathname);
  const shouldShowSidebar = pathname && !isWorkPage
    ? SHOW_SIDEBAR_ROUTES.some((prefix) =>
        prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)
      )
    : false;

  // Debug sidebar visibility logic
  console.log('🔍 ClientLayoutShell Debug:', {
    pathname,
    isWorkPage,
    shouldShowSidebar,
    showSidebarRoutes: SHOW_SIDEBAR_ROUTES
  });

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
