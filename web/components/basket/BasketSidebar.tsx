"use client";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { createDocumentWithPrompt } from "@/lib/documents/createDocument";
import SidebarToggleIcon from "@/components/icons/SidebarToggleIcon";
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
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);

  const toggleDocExpansion = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleCreateDocument = async () => {
    if (isCreatingDocument) return;
    
    setIsCreatingDocument(true);
    try {
      const newDocument = await createDocumentWithPrompt(basketId);
      router.refresh();
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document. Please try again.');
    } finally {
      setIsCreatingDocument(false);
    }
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
              onClick={() => router.push("/dashboard/home")}
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
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Documents
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleCreateDocument}
              disabled={isCreatingDocument}
            >
              {isCreatingDocument ? "..." : "+"}
            </Button>
          </div>
          
          <nav className="space-y-1">
            {documents.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No documents yet
              </div>
            ) : (
              documents.map((doc) => (
                <DocumentNavItem
                  key={doc.id}
                  document={doc}
                  basketId={basketId}
                  expanded={expandedDocs.has(doc.id)}
                  active={currentDocId === doc.id}
                  currentTab={currentTab}
                  onToggleExpand={() => toggleDocExpansion(doc.id)}
                  onNavigate={handleNavigation}
                />
              ))
            )}
          </nav>
        </div>
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

interface DocumentNavItemProps {
  document: Document;
  basketId: string;
  expanded: boolean;
  active: boolean;
  currentTab: string;
  onToggleExpand: () => void;
  onNavigate: (path: string) => void;
}

function DocumentNavItem({
  document,
  basketId,
  expanded,
  active,
  currentTab,
  onToggleExpand,
  onNavigate,
}: DocumentNavItemProps) {
  const docActive = active && !currentTab.includes("insights") && !currentTab.includes("history");
  const docInsightsActive = active && currentTab.includes("insights");
  const docHistoryActive = active && currentTab.includes("history");

  return (
    <div className="space-y-1">
      {/* Main document item */}
      <div className="flex items-center">
        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground mr-1"
        >
          {expanded ? "⌄" : "›"}
        </button>
        <button
          onClick={() => onNavigate(`/baskets/${basketId}/work/documents/${document.id}`)}
          className={cn(
            "flex-1 flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left",
            docActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="text-base">📄</span>
          <span className="flex-1 truncate">{document.title || `Document ${document.id.slice(0, 8)}`}</span>
        </button>
      </div>

      {/* Expanded document sub-items */}
      {expanded && (
        <div className="ml-6 space-y-1">
          <button
            onClick={() => onNavigate(`/baskets/${basketId}/work/documents/${document.id}`)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1 text-sm rounded-md transition-colors text-left",
              docInsightsActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-sm">🧠</span>
            <span className="flex-1">Insights</span>
          </button>
          <button
            onClick={() => onNavigate(`/baskets/${basketId}/work/timeline`)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1 text-sm rounded-md transition-colors text-left",
              docHistoryActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-sm">📜</span>
            <span className="flex-1">History</span>
          </button>
        </div>
      )}
    </div>
  );
}
