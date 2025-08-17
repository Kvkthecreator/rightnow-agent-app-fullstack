"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BasketNavProps {
  basketId: string;
}

export default function BasketNav({ basketId }: BasketNavProps) {
  const pathname = usePathname();
  const links = [
    { href: `/baskets/${basketId}/dashboard`, label: "Dashboard" },
    { href: `/baskets/${basketId}/documents`, label: "Documents" },
    { href: `/baskets/${basketId}/blocks`, label: "Blocks" },
    { href: `/baskets/${basketId}/timeline`, label: "Timeline" },
  ];
  return (
    <nav className="w-48 border-r p-4 space-y-2 text-sm">
      {links.map((link) => {
        const active = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded px-2 py-1",
              active ? "bg-muted font-medium" : "text-muted-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
