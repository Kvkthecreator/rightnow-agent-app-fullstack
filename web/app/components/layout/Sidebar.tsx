// web/app/components/layout/Sidebar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import Brand from "@/components/Brand";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "🧶 Dashboard" },
  { href: "/baskets", label: "🧺 Baskets" },
  { href: "/basket/create", label: "➕ New Basket" },
  { href: "/blocks", label: "◾ Blocks" },
  { href: "/queue", label: "🪄 Queue" },
];

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Toggle Button w/ Brand logo */}
      <div className="md:hidden p-4">
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-xl border border-border bg-white flex items-center justify-center shadow-sm hover:bg-muted transition"
        >
          {open ? (
            <X className="w-5 h-5 text-foreground" />
          ) : (
            <Brand className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-background border-r border-border shadow-md transform transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:relative md:block"
        )}
      >
        <div className="h-full flex flex-col justify-between p-4">
          {/* Top: Brand + Nav */}
          <div className="space-y-6">
            <Link href="/" className="hidden md:block">
              <Brand className="w-8 h-8 hover:opacity-80 transition" />
            </Link>
            <nav className="flex flex-col space-y-2 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-md px-3 py-2 transition hover:bg-muted hover:text-foreground",
                    pathname === item.href
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom: Email */}
          <div className="text-sm text-muted-foreground border-t border-border pt-4">
            <div className="px-3 py-2 rounded-md bg-muted/40 hover:bg-muted transition cursor-pointer">
              seulkim88@gmail.com
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
