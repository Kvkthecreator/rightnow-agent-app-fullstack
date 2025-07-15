"use client";
import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";

export default function TopBar() {
  const { isOpen, openSidebar } = useSidebarStore();
  const pathname = usePathname();

  const pageTitle = React.useMemo(() => {
    if (!pathname || pathname === "/") return "yarnnn";
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "yarnnn";
    return decodeURIComponent(last).replace(/[-_]/g, " ");
  }, [pathname]);

  // Only show TopBar when sidebar is closed
  if (isOpen) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/70 px-3 backdrop-blur"
      )}
    >
      <button
        aria-label="Open sidebar"
        className="p-1.5 rounded hover:bg-muted transition"
        onClick={openSidebar}
      >
        <SidebarToggleIcon className="h-5 w-5 text-muted-foreground" />
      </button>
      <span className="flex-1 truncate text-sm font-medium">
        {pageTitle}
      </span>
      <div className="w-5" />
    </header>
  );
}
