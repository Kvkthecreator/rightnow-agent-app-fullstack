"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useMemo } from "react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function SidebarItem({ href, children, className = "", onClick }: SidebarItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href + "/");
  const [pending, startTransition] = useTransition();

    const classes = useMemo(
    () =>
      cn(
        // base styles
        "w-full text-left px-2 py-1.5 text-sm rounded-md transition",
        // visual state
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted",
        className
      ),
    [active, className]
  );

  return (
    <Link
      href={href}
      prefetch
      onClick={() => {
        startTransition(() => {});
        onClick?.();
      }}
      className={classes}
      aria-busy={pending || undefined}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export default SidebarItem;
