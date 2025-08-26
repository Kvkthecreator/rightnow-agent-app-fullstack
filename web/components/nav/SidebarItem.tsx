"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

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

  return (
    <Link
      href={href}
      prefetch
      onClick={() => {
        startTransition(() => {});
        onClick?.();
      }}
      className={`${className} ${active ? "is-active" : ""}`}
      aria-busy={pending || undefined}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export default SidebarItem;
