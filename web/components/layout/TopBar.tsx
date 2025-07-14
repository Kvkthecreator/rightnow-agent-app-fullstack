"use client";
import { LayoutPanelLeft } from "lucide-react";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";

export default function TopBar() {
  const { isOpen, open } = useSidebarStore();
  const pathname = usePathname();

  const forceShow = /^\/baskets\/[^/]+\/work$/.test(pathname);

  const show = !isOpen || forceShow;

  const pageTitle = React.useMemo(() => {
    if (!pathname || pathname === "/") return "yarnnn";
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "yarnnn";
    return decodeURIComponent(last).replace(/[-_]/g, " ");
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/70 px-3 backdrop-blur",
        show ? "lg:hidden" : "lg:hidden pointer-events-none opacity-0"
      )}
    >
      <button
        aria-label="Open sidebar"
        className="rounded p-1.5 hover:bg-muted"
        onClick={open}
      >
        <LayoutPanelLeft className="h-5 w-5" />
      </button>
      <span className="flex-1 truncate text-sm font-medium">{pageTitle}</span>
      <div className="w-5" />
    </header>
  );
}
