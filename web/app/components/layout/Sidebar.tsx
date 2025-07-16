"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Package2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { getActiveWorkspaceId } from "@/lib/workspace";
import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
import { useSidebarStore } from "@/lib/stores/sidebarStore";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { isOpen, collapsible, toggleSidebar, closeSidebar } = useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [baskets, setBaskets] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
      const ws = await getActiveWorkspaceId(supabase, user?.id);
      setWorkspaceId(ws);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const fetchBaskets = async () => {
      if (!workspaceId) return;
      const { data } = await supabase
        .from("baskets")
        .select("id, name, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      setBaskets(data || []);
    };
    fetchBaskets();
  }, [supabase, workspaceId]);

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
    if (!workspaceId) return;
    const { data } = await supabase
      .from("baskets")
      .insert({ name: "Untitled Basket", state: "draft", workspace_id: workspaceId })
      .select("id")
      .single();
    if (data) {
      router.push(`/baskets/${data.id}/work`);
    }
  };

  const showHint = /^\/baskets\/[^/]+/.test(pathname || "");

  return (
    <aside
      className={`sidebar fixed top-0 left-0 z-40 h-screen w-64 bg-background border-r border-border shadow-md transition-all duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } ${collapsible ? "md:relative md:translate-x-0" : ""} ${className ?? ""}`}
    >
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-3 flex items-center justify-between">
        <button onClick={handleBrandClick} className="font-brand text-xl tracking-tight hover:underline">
          yarnnn
        </button>
        <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="p-1.5 rounded hover:bg-muted transition">
          <SidebarToggleIcon className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
      <div className="px-4 py-3 border-b">
        <button onClick={handleNewBasket} className="flex items-center space-x-2 text-sm text-gray-700 hover:text-black">
          <Plus size={16} />
          <span>New Basket</span>
        </button>
      </div>
      <div className="px-4 pt-4 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        🧺 Baskets
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {baskets.map((b) => (
          <button
            key={b.id}
            onClick={() => router.push(`/baskets/${b.id}/work`)}
            className={cn(
              "w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center",
              pathname?.includes(b.id) ? "bg-gray-100 font-semibold" : ""
            )}
          >
            <Package2 size={14} className="inline-block mr-2" />
            {b.name || "Untitled"}
          </button>
        ))}
      </div>
      <div className="border-t px-4 py-3 text-sm text-muted-foreground">
        {userEmail ? (
          <details className="group rounded-md bg-muted/40 px-3 py-2 hover:bg-muted transition cursor-pointer">
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
          <p className="mt-4 text-xs hidden md:block">⇧ V to quick-dump into this basket</p>
        )}
      </div>
    </aside>
  );
}
