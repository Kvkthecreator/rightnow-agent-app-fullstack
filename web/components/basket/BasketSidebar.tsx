"use client";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
import LeftNavDocuments from "@/components/basket/LeftNavDocuments";
import type { Document } from "@/types";

interface Props {
  basketId: string;
  basketName: string;
  status: string;
  scope: string[];
  documents?: Document[];
  currentDocumentId?: string;
  className?: string;
}

export default function BasketSidebar({
  basketId,
  basketName,
  status,
  scope,
  documents = [],
  currentDocumentId,
  className,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const currentTab = params.get("tab") || "dashboard";
  
  // Extract document ID from URL path (e.g., /baskets/[id]/work/documents/[docId])
  const docMatch = pathname.match(/\/baskets\/[^\/]+\/work\/documents\/([^\/]+)/);
  const currentDocId = currentDocumentId || (docMatch ? docMatch[1] : params.get("docId"));
  
  const [collapsed, setCollapsed] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (collapsed) {
    return (
      <aside className={cn("w-12 border-r shrink-0 flex flex-col bg-background", className)}>
        <div className="p-2">
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="p-1.5 rounded hover:bg-muted transition w-full flex justify-center"
          >
            <SidebarToggleIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className={cn("w-[280px] border-r shrink-0 flex flex-col bg-background", className)}>
      {/* General Navigation Header */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/home")}
              className="text-xs px-2 py-1 h-7"
            >
              ← Back
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-lg">🧺</span>
              <span className="font-medium text-sm">Yarnnn</span>
            </div>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            className="p-1.5 rounded hover:bg-muted transition"
          >
            <SidebarToggleIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Basket Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-sm truncate flex-1">{basketName}</h2>
            <Badge variant="outline" className="text-xs">
              {status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {documents.length} documents • {scope.length} topics
          </p>
        </div>
      </div>

      {/* Basket Context Navigation */}
      <div className="p-4 border-b">
        <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Basket Context
        </h3>
        <nav className="space-y-1">
          <NavItem
            icon="📊"
            label="Dashboard"
            active={currentTab === "dashboard" && !currentDocId}
            onClick={() => handleNavigation(`/baskets/${basketId}/work`)}
          />
          <NavItem
            icon="🧠"
            label="Insights"
            active={currentTab === "insights" && !currentDocId}
            onClick={() => handleNavigation(`/baskets/${basketId}/work/documents`)}
          />
          <NavItem
            icon="📜"
            label="History"
            active={currentTab === "history" && !currentDocId}
            onClick={() => handleNavigation(`/baskets/${basketId}/work/timeline`)}
          />
        </nav>
      </div>

      {/* Documents Section */}
      <div className="flex-1 overflow-y-auto">
        <LeftNavDocuments
          basketId={basketId}
          documents={documents}
          currentDocId={currentDocId as string | undefined}
          currentTab={currentTab}
        />
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}

function NavItem({ icon, label, active, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left",
        active 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <Badge variant="secondary" className="text-xs">
          {badge}
        </Badge>
      )}
    </button>
  );
}
