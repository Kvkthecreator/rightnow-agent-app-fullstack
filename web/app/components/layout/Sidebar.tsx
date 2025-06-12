// web/app/components/layout/Sidebar.tsx

"use client";


import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabaseClient";

const baseItems = [
  { href: "/dashboard", label: "🧶 Dashboard" },
  { href: "/baskets", label: "🧺 Baskets" },
  { href: "/baskets/create", label: "➕ New Basket" },
  { href: "/blocks", label: "◾ Blocks" }, // 🧩 Moved here
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const showHint = /^\/baskets\/[^/]+/.test(pathname || "");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-40 h-screen w-64 max-w-[80%] bg-background/90 backdrop-blur-md border-r border-border shadow-md md:relative md:block md:min-h-screen"
        )}
      >
        <div className="h-full flex flex-col justify-between py-6 px-4">
          {/* Top: Brand + Nav */}
          <div className="space-y-6">
            <div className="font-brand text-xl tracking-tight pb-2 mb-2 border-b border-border">yarnnn</div>
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
            <details className="group px-3 py-2 rounded-md bg-muted/40 hover:bg-muted transition cursor-pointer">
              <summary className="list-none text-sm text-muted-foreground hover:text-foreground">
                seulkim88@gmail.com
              </summary>
              <div className="mt-2 ml-2 flex flex-col space-y-1 text-sm text-muted-foreground">
                <button onClick={handleSettings}>⚙️ Settings</button>
                <button onClick={handleLogout}>🔓 Sign Out</button>
              </div>
            </details>
            {showHint && (
              <p className="mt-4 text-xs hidden md:block">⇧ V to quick-dump into this basket</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
