"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBasket } from "@/contexts/BasketContext";

/**
 * Breadcrumb component that displays the current path segments.
 * Shows basket name instead of ID when inside a basket.
 */
export default function Breadcrumb() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);
  const { basket } = useBasket();

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      {segments.map((segment, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");

        // Check if this is a basket ID segment (comes after 'baskets')
        const isBasketId = idx > 0 && segments[idx - 1] === 'baskets' && basket?.id === segment;
        const label = isBasketId && basket?.name
          ? basket.name
          : segment.charAt(0).toUpperCase() + segment.slice(1);

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