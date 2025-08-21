"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { SECTION_ORDER } from "./sections";

interface Props {
  basketId: string;
}

export default function SectionSwitcher({ basketId }: Props) {
  const pathname = usePathname();
  const items = SECTION_ORDER;

  return (
    <>
      <nav className="flex gap-2">
        {items.map((section) => {
          const href = section.href(basketId);
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={section.key}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
      <div data-test="section-switcher-order" className="hidden">
        {items.map((s) => s.label).join(",")}
      </div>
    </>
  );
}
