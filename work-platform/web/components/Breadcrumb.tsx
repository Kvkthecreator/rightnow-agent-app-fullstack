"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Breadcrumb component that displays the current path segments.
 */
export default function Breadcrumb() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      {segments.map((segment, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <span key={idx} className="inline-flex items-center">
            {idx > 0 && <span className="px-1">/</span>}
            <Link href={href} className="hover:underline">
              {label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}