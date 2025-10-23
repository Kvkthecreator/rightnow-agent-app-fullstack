"use client";

import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
import { useNavState } from "@/components/nav/useNavState";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";
import Link from "next/link";
import { SECTION_ORDER } from "@/components/features/baskets/sections";
import UserNav from "@/components/UserNav";
import ActionCenter from "@/components/notifications/ActionCenter";

export default function TopBar() {
  const { toggle, open } = useNavState();
  const pathname = usePathname();

  const crumbs = React.useMemo(() => {
    const items: { label: string; href?: string }[] = [];
    if (!pathname) return items;
    const segments = pathname.split("/").filter(Boolean);

    const labelBySegment: Record<string, string> = SECTION_ORDER.reduce(
      (acc, s) => {
        const href = s.href("_id_");
        const end = href.split("/").filter(Boolean).pop();
        if (end) acc[end] = s.label;
        return acc;
      },
      {} as Record<string, string>
    );

    if (segments[0] === "baskets") {
      const basketId = segments[1];
      items.push({ label: "Baskets", href: "/baskets" });
      if (basketId) {
        items.push({ label: "Basket", href: `/baskets/${basketId}/overview` });
      }
      const section = segments[2];
      if (section) {
        items.push({ label: labelBySegment[section] ?? capitalize(section) });
      }
      if (segments.length > 3) {
        items.push({ label: prettify(segments[segments.length - 1]) });
      }
      return items;
    }

    items.push({ label: prettify(segments[0] ?? "yarnnn"), href: "/" });
    if (segments.length > 1) items.push({ label: prettify(segments[1]) });
    return items;
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-[70] flex h-12 items-center gap-2 px-3",
        "bg-transparent backdrop-blur-sm"
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

      <nav aria-label="Breadcrumb" className="flex-1 overflow-hidden">
        <ol className="flex items-center gap-1 text-xs overflow-x-auto">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={i} className="shrink-0 flex items-center">
                {i > 0 && <span className="mx-1.5 text-muted-foreground/50">›</span>}
                {c.href && !isLast ? (
                  <Link 
                    href={c.href} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className={cn(
                    "font-medium",
                    isLast ? "text-foreground text-sm" : "text-muted-foreground"
                  )}>
                    {c.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Top Bar Actions */}
      <div className="flex items-center gap-2">
        <ActionCenter />
        <UserNav compact />
      </div>
    </header>
  );
}

function prettify(s: string) {
  try {
    return decodeURIComponent(s).replace(/[-_]/g, " ");
  } catch {
    return s;
  }
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
