"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Package2,
  LogOut,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/clients";
import { getAllBaskets } from "@/lib/baskets/getAllBaskets";
import type { BasketOverview } from "@/lib/baskets/getAllBaskets";
import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
import { useSidebarStore } from "@/lib/stores/sidebarStore";

interface SidebarProps {
  className?: string;
}

const supabase = createBrowserClient();

const BASKET_SECTIONS = [
  { key: "memory", label: "Memory", path: "/memory" },
  { key: "documents", label: "Documents", path: "/documents" },
  { key: "blocks", label: "Blocks", path: "/blocks" },
  { key: "graph", label: "Graph", path: "/graph" },
  { key: "reflections", label: "Reflections", path: "/reflections" },
  { key: "timeline", label: "Timeline", path: "/timeline" },
];

export default function Sidebar({ className }: SidebarProps) {
  const { isVisible, collapsible, toggleSidebar, closeSidebar, openSidebar, setCollapsible } =
    useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [baskets, setBaskets] = useState<BasketOverview[] | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [expandedBasket, setExpandedBasket] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCollapsible(mobile);
      
      // On mobile, sidebar should be hidden by default
      if (mobile && isVisible) {
        closeSidebar();
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setCollapsible, closeSidebar, isVisible]);

  // Persist sidebar visibility (desktop only)
  useEffect(() => {
    if (typeof window === "undefined" || isMobile) return;
    const stored = localStorage.getItem("yarnnn:sidebar:visible");
    if (stored === "false") {
      closeSidebar();
    } else {
      openSidebar();
    }
  }, [closeSidebar, openSidebar, isMobile]);

  useEffect(() => {
    if (typeof window === "undefined" || isMobile) return;
    localStorage.setItem("yarnnn:sidebar:visible", String(isVisible));
  }, [isVisible, isMobile]);

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
        console.error("❌ Sidebar: Init error:", err);
        setBaskets([]);
      }
    }
    init();
  }, []);

  // Expand basket based on current route
  useEffect(() => {
    const match = pathname?.match(/\/baskets\/([^/]+)/);
    if (match) setExpandedBasket(match[1]);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // Handle dropdown clicks
      if (
        openDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(false);
      }
      
      // Handle mobile sidebar overlay clicks
      if (isMobile && isVisible && !(e.target as HTMLElement).closest(".sidebar")) {
        closeSidebar();
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdown, isMobile, isVisible, closeSidebar]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };


  const handleNavigateToBaskets = () => {
    try {
      router.push("/baskets");
      // Close sidebar on mobile after navigation
      if (isMobile) {
        closeSidebar();
      }
    } catch (error) {
      console.error('❌ Sidebar: Failed to navigate to baskets:', error);
    }
  };

  const handleBasketClick = (basketId: string) => {
    setExpandedBasket((prev) => (prev === basketId ? null : basketId));
    try {
      router.push(`/baskets/${basketId}/memory`);
      // Close sidebar on mobile after navigation
      if (isMobile) {
        closeSidebar();
      }
    } catch (error) {
      console.error('❌ Sidebar: Failed to navigate to basket work:', error);
    }
  };

  const handleSectionNavigate = (basketId: string, path: string) => {
    try {
      router.push(`/baskets/${basketId}${path}`);
      // Close sidebar on mobile after navigation
      if (isMobile) {
        closeSidebar();
      }
    } catch (error) {
      console.error('❌ Sidebar: Failed to navigate to section:', error);
    }
  };

  const handleNavigateToSettings = () => {
    try {
      router.push("/dashboard/settings");
      // Close sidebar on mobile after navigation
      if (isMobile) {
        closeSidebar();
      }
    } catch (error) {
      console.error('❌ Sidebar: Failed to navigate to settings:', error);
    }
  };

  const showHint = /^\/baskets\/[^/]+/.test(pathname || "");

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar h-screen w-64 bg-background border-r border-border transition-transform duration-300 flex flex-col",
          isMobile
            ? "fixed top-0 left-0 z-40 shadow-lg"
            : "relative",
          isVisible ? "translate-x-0" : "-translate-x-full",
          // On desktop, show/hide based on isVisible
          // On mobile, always transform but use z-index and overlay
          !isVisible && !isMobile && "hidden",
          className
        )}
      >
      {/* Top header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
          baskets.map((b) => {
            const isActive = pathname?.startsWith(`/baskets/${b.id}`);
            const isExpanded = expandedBasket === b.id;
            return (
              <div key={b.id}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleBasketClick(b.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground",
                  )}
                  aria-expanded={isExpanded}
                >
                  <Package2 size={14} />
                  <span className="truncate">{b.name || "Untitled Basket"}</span>
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 transition-transform",
                      isExpanded ? "rotate-180" : "",
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="mt-1 ml-6 space-y-1">
                    {BASKET_SECTIONS.map((section) => {
                      const sectionActive = pathname?.startsWith(
                        `/baskets/${b.id}${section.path}`
                      );
                      return (
                        <button
                          key={section.key}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSectionNavigate(b.id, section.path);
                          }}
                          className={cn(
                            "w-full text-left px-2 py-1.5 text-sm rounded-md transition",
                            sectionActive
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                          aria-current={sectionActive ? "page" : undefined}
                        >
                          {section.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
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
    </>
  );
}
