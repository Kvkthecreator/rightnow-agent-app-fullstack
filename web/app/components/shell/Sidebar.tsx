"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Package2, LogOut, Settings2, FileText, Clock, Brain, Network, Layers, BookOpen, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/clients";
import { getAllBaskets } from "@/lib/baskets/getAllBaskets";
import type { BasketOverview } from "@/lib/baskets/getAllBaskets";
import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
import { useNavState } from "@/components/nav/useNavState";
import { useBasketDocuments } from "@/lib/hooks/useBasketDocuments";
import { getBasket } from "@/lib/api/baskets";
import SidebarItem from "@/components/nav/SidebarItem";
import { SECTION_ORDER } from "@/components/features/baskets/sections";

interface SidebarProps {
  className?: string;
}

const supabase = createBrowserClient();

export default function Sidebar({ className }: SidebarProps) {
  const { open, setOpen, toggle } = useNavState();
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
      const wasMobile = isMobile;
      setIsMobile(mobile);

      // When switching from desktop to mobile, close sidebar to avoid covering content
      if (mobile && !wasMobile && open) {
        setOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isMobile, open, setOpen]);

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);
        // Determine basket from path if possible; fallback to first
        const idFromPath = pathname?.match(/^\/baskets\/([^/]+)/)?.[1];
        if (idFromPath) {
          try {
            const b = await getBasket(idFromPath);
            setBasket({ id: b.id, name: b.name } as BasketOverview);
          } catch {
            const data = await getAllBaskets();
            setBasket(data[0] || null);
          }
        } else {
          const data = await getAllBaskets();
          setBasket(data[0] || null);
        }
      } catch (err) {
        console.error("❌ Sidebar: Init error:", err);
        setBasket(null);
      }
    }
    init();
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openDropdown && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(false);
      }

      if (isMobile && open && !(e.target as HTMLElement).closest(".sidebar")) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdown, isMobile, open, setOpen]);

  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };


  const handleSectionNavigate = (href: string) => {
    try {
      router.push(href);
      if (isMobile) {
        setOpen(false);
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
        setOpen(false);
      }
    } catch (error) {
      console.error("❌ Sidebar: Failed to navigate to settings:", error);
    }
  };

  const showHint = /^\/baskets\/[^/]+/.test(pathname || "");
  const basketId = pathname?.match(/^\/baskets\/([^/]+)/)?.[1] || basket?.id;
  const { documents: docList, isLoading: docsLoading } = useBasketDocuments(basketId || "");

  // Map section keys to icons
  const sectionIcons: Record<string, React.ElementType> = {
    memory: BookOpen,
    governance: Shield,
    timeline: Clock,
    reflections: Brain,
    graph: Network,
    "building-blocks": Layers,
    documents: FileText
  };

  return (
    <>
      {/* Scrim for mobile when sidebar is open */}
      {isMobile && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className={cn(
            "fixed inset-0 z-[49] bg-black/40 transition-opacity md:hidden",
            open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
          )}
        />
      )}

      <aside
        id="global-sidebar"
        className={cn(
          "sidebar h-screen w-64 border-r border-border transition-transform duration-300 flex flex-col z-[50]",
          isMobile ? "fixed top-0 left-0 bg-background shadow-xl" : "relative bg-card",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          !open && !isMobile && "hidden",
          className,
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "sticky top-0 z-10 flex h-12 items-center justify-between border-b px-4",
            "bg-background",
          )}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push("/");
            }}
            className="text-xl tracking-tight hover:underline font-brand"
          >
            yarnnn
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="p-1.5 rounded hover:bg-muted transition"
          >
            <SidebarToggleIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
          {basket ? (
            <div>
              {/* Basket section with merged icon and name */}
              <div className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                🧺 {basket.name || "Untitled Basket"}
              </div>
              <div className="ml-4 flex flex-col gap-0.5">
                {SECTION_ORDER.filter((s) => s.key !== "documents").map((section) => {
                  const href = section.href(basket.id);
                  const Icon = sectionIcons[section.key];
                  return (
                    <SidebarItem
                      key={section.key}
                      href={href}
                      onClick={() => {
                        if (isMobile) {
                          setOpen(false);
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {Icon && <Icon size={14} />}
                        {section.label}
                      </span>
                    </SidebarItem>
                  );
                })}
              </div>
              {/* Documents section */}
              <div className="mt-4">
                <div className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  📄 Documents  
                </div>
                <div className="ml-4 space-y-1">
                  {docsLoading && (
                    <p className="text-sm text-muted-foreground px-2 py-1">Loading...</p>
                  )}
                  {!docsLoading && docList?.length === 0 && (
                    <p className="text-sm text-muted-foreground px-2 py-1">No documents</p>
                  )}
                  {!docsLoading && docList?.map((doc: any) => {
                    const href = `/baskets/${basket.id}/documents/${doc.id}`;
                    return (
                      <SidebarItem
                        key={doc.id}
                        href={href}
                        onClick={() => {
                          if (isMobile) setOpen(false);
                        }}
                      >
                        {doc.title || "Untitled"}
                      </SidebarItem>
                    );
                  })}
                </div>
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
