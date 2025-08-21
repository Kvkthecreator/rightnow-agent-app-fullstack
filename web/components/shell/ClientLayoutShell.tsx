"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/app/components/shell/Sidebar";
import TopBar from "@/components/common/TopBar";
import type { ReactNode } from "react";

// These routes will show global sidebar
const SHOW_SIDEBAR_ROUTES = [
  "/home",
  "/dashboard",
  "/blocks", 
  "/context",
  "/create",
];

// Check if we should show the global sidebar - only on /baskets (not /baskets/[id]/*)
const shouldShowGlobalSidebar = (pathname: string | null): boolean => {
  if (!pathname) return false;
  
  // Show sidebar exactly on /baskets route (list view)
  if (pathname === "/baskets") return true;
  
  // Show sidebar on other allowed routes
  return SHOW_SIDEBAR_ROUTES.some(route => pathname.startsWith(route));
};

export default function ClientLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const shouldShowSidebar = shouldShowGlobalSidebar(pathname);

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
