"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Package2, LogOut, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/clients";
import { getAllBaskets } from "@/lib/baskets/getAllBaskets";
import type { BasketOverview } from "@/lib/baskets/getAllBaskets";
import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { SECTION_ORDER } from "@/components/features/baskets/sections";

interface SidebarProps {
  className?: string;
}

const supabase = createBrowserClient();

export default function Sidebar({ className }: SidebarProps) {
  const { isVisible, collapsible, toggleSidebar, closeSidebar, openSidebar, setCollapsible } =
    useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [basket, setBasket] = useState<BasketOverview | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);
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
        setBasket(data[0] || null);
      } catch (err) {
        console.error("❌ Sidebar: Init error:", err);
        setBasket(null);
      }
    }
    init();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // Handle dropdown clicks
      if (openDropdown && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const handleSectionNavigate = (href: string) => {
    try {
      router.push(href);
      if (isMobile) {
        closeSidebar();
      }
    } catch (error) {
      console.error("❌ Sidebar: Failed to navigate to section:", error);
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
      console.error("❌ Sidebar: Failed to navigate to settings:", error);
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
          isMobile ? "fixed top-0 left-0 z-40 shadow-lg" : "relative",
          isVisible ? "translate-x-0" : "-translate-x-full",
          // On desktop, show/hide based on isVisible
          // On mobile, always transform but use z-index and overlay
          !isVisible && !isMobile && "hidden",
          className,
        )}
      >
        {/* Top header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push("/");
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

        {/* Basket */}
        <div className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          🧺 Basket
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {basket ? (
            <div>
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm">
                <Package2 size={14} />
                <span className="truncate">{basket.name || "Untitled Basket"}</span>
              </div>
              <div className="mt-1 ml-6 space-y-1">
                {SECTION_ORDER.map((section) => {
                  const href = section.href(basket.id);
                  const sectionActive = pathname?.startsWith(href);
                  return (
                    <button
                      key={section.key}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSectionNavigate(href);
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
            </div>
          ) : (
            <p className="text-sm text-muted-foreground px-2 py-1">Loading...</p>
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
