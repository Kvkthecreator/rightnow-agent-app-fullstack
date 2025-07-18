"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/app/components/shell/Sidebar";
import TopBar from "@/components/common/TopBar";
import { ReactNode } from "react";

const SHOW_SIDEBAR_ROUTES = [
  "/home",
  "/baskets",
  "/dashboard",
  "/blocks",
  "/context",
];

export default function ClientLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const shouldShowSidebar = pathname
    ? SHOW_SIDEBAR_ROUTES.some((prefix) =>
        prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)
      )
    : false;

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
