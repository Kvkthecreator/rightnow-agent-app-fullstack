"use client";

import Link from "next/link";
import { ChevronLeft, Menu } from "lucide-react";

interface TopBarProps {
  title: string;
  onToggleNav: () => void;
}

export default function TopBar({ title, onToggleNav }: TopBarProps) {
  return (
    <header className="flex h-12 items-center gap-2 border-b px-4">
      <Link href="/baskets" aria-label="Back to baskets" className="p-2">
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <span className="flex-1 truncate font-medium">{title}</span>
      <button
        onClick={onToggleNav}
        aria-label="Toggle navigation"
        className="p-2"
      >
        <Menu className="h-4 w-4" />
      </button>
    </header>
  );
}
