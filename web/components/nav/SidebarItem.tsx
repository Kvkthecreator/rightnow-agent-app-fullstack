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
  match?: 'exact' | 'startsWith';
}

export function SidebarItem({ href, children, className = "", onClick, match = 'exact' }: SidebarItemProps) {
  const pathname = usePathname();
  const active = match === 'startsWith'
    ? (pathname === href || pathname?.startsWith(`${href}/`))
    : pathname === href;
  const [pending, startTransition] = useTransition();

    const classes = useMemo(
    () =>
      cn(
        // base styles
        "block w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200",
        // visual state with enhanced active indicator
        active
          ? "bg-primary/10 text-primary font-medium border-l-4 border-primary pl-2"
          : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-4 border-transparent",
        // hover state
        !active && "hover:pl-2.5",
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
