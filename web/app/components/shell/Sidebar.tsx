"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Package2, LogOut, Settings2 } from "lucide-react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [baskets, setBaskets] = useState<BasketOverview[] | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        console.log('🔍 Sidebar: User authenticated:', !!user, user?.email);
        setUserEmail(user?.email || null);
        const data = await getAllBaskets();
        console.log('🔍 Sidebar: Loaded baskets:', data.length);
        setBaskets(data);
      } catch (err) {
        console.error("❌ Sidebar: Init error:", err);
        setBaskets([]);
      }
    }
    init();
  }, [supabase]);

  // Debug pathname changes
  useEffect(() => {
    console.log('🔍 Sidebar: Pathname changed to:', pathname);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        openDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(false);
      }
      if (!collapsible) return;
      if (!(e.target as HTMLElement).closest(".sidebar")) {
        closeSidebar();
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdown, collapsible, closeSidebar]);

  const handleLogout = async () => {
    console.log('🔄 Sidebar: Logging out...');
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleNewBasket = async () => {
    console.log('🔄 Sidebar: Creating new basket...');
    try {
      const { id } = await createBasketNew({});
      console.log('✅ Sidebar: Created basket:', id);
      router.push(`/baskets/${id}/work`);
    } catch (error) {
      console.error('❌ Sidebar: Failed to create basket:', error);
    }
  };

  const handleNavigateToBaskets = () => {
    console.log('🔄 Sidebar: Navigating to /baskets');
    console.log('🔍 Sidebar: Current pathname:', pathname);
    console.log('🔍 Sidebar: User email:', userEmail);
    try {
      router.push("/baskets");
      console.log('✅ Sidebar: Navigation call completed');
    } catch (error) {
      console.error('❌ Sidebar: Failed to navigate to baskets:', error);
    }
  };

  const handleNavigateToBasketWork = (basketId: string) => {
    console.log('🔄 Sidebar: Navigating to basket work:', basketId);
    console.log('🔍 Sidebar: Current pathname:', pathname);
    console.log('🔍 Sidebar: Target path:', `/baskets/${basketId}/work`);
    try {
      router.push(`/baskets/${basketId}/work`);
      console.log('✅ Sidebar: Basket navigation call completed');
    } catch (error) {
      console.error('❌ Sidebar: Failed to navigate to basket work:', error);
    }
  };

  const handleNavigateToSettings = () => {
    console.log('🔄 Sidebar: Navigating to settings');
    try {
      router.push("/dashboard/settings");
    } catch (error) {
      console.error('❌ Sidebar: Failed to navigate to settings:', error);
    }
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
      {/* Top header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <button
          onClick={(e) => {
            console.log('🖱️ Sidebar: Logo clicked - event triggered');
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Sidebar: Logo clicked - prevented default');
            handleNavigateToBaskets();
          }}
          className="font-brand text-xl tracking-tight hover:underline"
        >
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
          onClick={(e) => {
            console.log('🖱️ Sidebar: New basket clicked - event triggered');
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Sidebar: New basket clicked - prevented default');
            handleNewBasket();
          }}
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
              onClick={(e) => {
                console.log('🖱️ Sidebar: Basket clicked - event triggered:', b.id, b.name);
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Sidebar: Basket clicked - prevented default:', b.id);
                handleNavigateToBasketWork(b.id);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition",
                pathname?.includes(b.id)
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <Package2 size={14} />
              <span className="truncate">{b.name || "Untitled Basket"}</span>
            </button>
          ))
        )}
      </div>

      {/* Footer + Dropdown */}
      <div className="relative border-t px-4 py-3">
        {userEmail ? (
          <div className="relative w-full" ref={dropdownRef}>
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="text-sm text-muted-foreground hover:text-foreground w-full text-left truncate"
            >
              {userEmail}
            </button>
            {openDropdown && (
              <div className="absolute bottom-12 left-0 w-52 rounded-md border bg-popover shadow-md z-50 py-1 text-sm">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('🖱️ Sidebar: Settings clicked');
                    setOpenDropdown(false);
                    handleNavigateToSettings();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Settings2 size={14} />
                  Settings
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('🖱️ Sidebar: Logout clicked');
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-destructive hover:bg-muted"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not signed in</p>
        )}
        {showHint && (
          <p className="mt-4 text-xs hidden md:block">⇧ V to quick-dump into this basket</p>
        )}
      </div>
    </aside>
  );
}
