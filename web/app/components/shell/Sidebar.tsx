"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Package2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { getAllBaskets, BasketOverview } from "@/lib/baskets/getAllBaskets";
import { createBasketNew } from "@/lib/baskets/createBasketNew";
import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
import { useSidebarStore } from "@/lib/stores/sidebarStore";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { isVisible, collapsible, toggleSidebar, closeSidebar } = useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [baskets, setBaskets] = useState<BasketOverview[] | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);
        const data = await getAllBaskets();
        setBaskets(data);
      } catch (err) {
        console.error("sidebar init", err);
        setBaskets([]);
      }
    }
    init();
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!collapsible) return;
      if (!(e.target as HTMLElement).closest(".sidebar")) {
        closeSidebar();
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [collapsible, closeSidebar]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleBrandClick = () => {
    router.push("/baskets");
  };

  const handleNewBasket = async () => {
    const { id } = await createBasketNew({ text_dump: null });
    router.push(`/baskets/${id}/work`);
  };

  const showHint = /^\/baskets\/[^/]+/.test(pathname || "");

  if (!isVisible) return null;

  return (
    <aside
      className={cn(
        "sidebar h-screen w-64 bg-background border-r border-border transition-transform duration-300 flex flex-col",
        collapsible
          ? "fixed top-0 left-0 z-40 shadow-md md:relative md:translate-x-0"
          : "relative",
        isVisible ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        className
      )}
    >
      {/* Top header bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <button onClick={handleBrandClick} className="font-brand text-xl tracking-tight hover:underline">
          yarnnn
        </button>
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="p-1.5 rounded hover:bg-muted transition"
        >
          <SidebarToggleIcon className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* New Basket */}
      <div className="px-4 py-3 border-b">
        <button
          onClick={handleNewBasket}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted font-medium text-muted-foreground hover:text-foreground transition"
        >
          <Plus size={16} />
          <span>New Basket</span>
        </button>
      </div>

      {/* Basket list */}
      <div className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        🧺 Baskets
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {baskets === null ? (
          <p className="text-sm text-muted-foreground px-2 py-1">Loading baskets...</p>
        ) : baskets.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-1">
            No baskets yet. Click “New Basket”.
          </p>
        ) : (
          baskets.map((b) => (
            <button
              key={b.id}
              onClick={() => router.push(`/baskets/${b.id}/work`)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition",
                pathname?.includes(b.id) ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              <Package2 size={14} />
              <span className="truncate">{b.name || "Untitled Basket"}</span>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="relative border-t px-4 py-3">
        {userEmail ? (
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="text-sm text-muted-foreground hover:text-foreground w-full text-left truncate"
          >
            {userEmail}
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">Not signed in</p>
        )}
        {openDropdown && (
          <div className="absolute left-4 top-10 w-[200px] rounded-md border bg-white shadow-lg z-50">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted"
            >
              🔓 Sign Out
            </button>
          </div>
        )}
        {showHint && (
          <p className="mt-4 text-xs hidden md:block">⇧ V to quick-dump into this basket</p>
        )}
      </div>
    </aside>
  );
}
