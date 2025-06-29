"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const baseItems = [
  { href: "/dashboard", label: "🧶 Dashboard" },
  { href: "/baskets", label: "🧺 Baskets" },
  { href: "/baskets/new", label: "➕ New Basket" },
  { href: "/blocks", label: "◾ Blocks" },
  { href: "/settings", label: "⚙️ Settings" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsible?: boolean;
  className?: string;
}

const Sidebar = ({ open, onClose, collapsible = false, className }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
    };
    getSession();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleBrandClick = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  const showHint = /^\/baskets\/[^/]+/.test(pathname || "");

  return (
    <aside
      className={clsx(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-background border-r border-border shadow-md transform transition-transform",
        collapsible ? "md:fixed" : "md:relative md:block md:min-h-screen",
        open ? "translate-x-0" : "-translate-x-full",
        !collapsible && "md:translate-x-0",
        className
      )}
    >
      <button
        className={clsx(
          "absolute top-3 left-3 p-1 rounded-md hover:bg-muted",
          !collapsible && "md:hidden"
        )}
        onClick={onClose}
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="h-full flex flex-col justify-between py-6 px-4">
        {/* Top: Brand + Nav */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <button
              onClick={handleBrandClick}
              className="font-brand text-xl tracking-tight hover:underline"
            >
              yarnnn
            </button>
          </div>
          <nav className="flex flex-col space-y-2 text-sm">
            {baseItems.map((item) => (
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

        {/* Bottom: Email / User Menu */}
        <div className="text-sm text-muted-foreground border-t border-border pt-4">
          {userEmail ? (
            <details className="group px-3 py-2 rounded-md bg-muted/40 hover:bg-muted transition cursor-pointer">
              <summary className="list-none text-sm text-muted-foreground hover:text-foreground">
                {userEmail}
              </summary>
              <div className="mt-2 ml-2 flex flex-col space-y-1 text-sm text-muted-foreground">
                <button onClick={handleLogout}>🔓 Sign Out</button>
              </div>
            </details>
          ) : (
            <p className="px-3 py-2">Not signed in</p>
          )}
          {showHint && (
            <p className="mt-4 text-xs hidden md:block">
              ⇧ V to quick-dump into this basket
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
