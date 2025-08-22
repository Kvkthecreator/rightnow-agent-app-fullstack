"use client";

import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
import { useNavState } from "@/components/nav/useNavState";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";

export default function TopBar() {
  const { toggle, open } = useNavState();
  const pathname = usePathname();

  const pageTitle = React.useMemo(() => {
    if (!pathname || pathname === "/") return "yarnnn";
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "yarnnn";
    return decodeURIComponent(last).replace(/[-_]/g, " ");
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-[70] flex h-12 items-center gap-2 border-b bg-background/70 px-3 backdrop-blur"
      )}
    >
      <button
        type="button"
        aria-label="Toggle sidebar"
        aria-controls="global-sidebar"
        aria-expanded={open}
        onClick={toggle}
        className="relative z-[60] p-2 rounded-md hover:bg-muted transition"
      >
        <span className="sr-only">Toggle navigation</span>
        <SidebarToggleIcon className="h-5 w-5 text-muted-foreground" />
      </button>

      <span className="flex-1 truncate text-sm font-medium">
        {pageTitle}
      </span>

      <div className="w-5" />
    </header>
  );
}
