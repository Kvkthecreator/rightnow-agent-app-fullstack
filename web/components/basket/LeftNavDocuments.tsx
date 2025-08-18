"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, FilePlus2, Upload } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCreateActions } from "@/hooks/useCreateActions";

import type { Document } from "@/types";

interface Props {
  basketId: string;
  documents: Document[];
  currentDocId?: string;
  currentTab: string;
}

export default function LeftNavDocuments({
  basketId,
  documents = [],
  currentDocId,
  currentTab,
}: Props) {
  const router = useRouter();
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const { quickDump, newBlankDocument, uploadFiles, handleSelectedFiles } =
    useCreateActions();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggleDocExpansion = (docId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Documents
        </h3>
        <Popover
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) triggerRef.current?.focus();
          }}
        >
          <PopoverTrigger asChild>
            <button
              ref={triggerRef}
              aria-label="Add to this basket"
              aria-haspopup="menu"
              aria-expanded={open}
              data-testid="documents-add-trigger"
              title="Add to this basket"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Plus className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            role="menu"
            className="w-72 p-0"
            align="end"
            sideOffset={4}
          >
            <div className="py-1">
              <MenuItem
                icon={FileText}
                title="Quick dump"
                desc="Paste, write, or drop files."
                autoFocus
                onSelect={() => {
                  setOpen(false);
                  quickDump();
                }}
                testId="documents-quick-dump"
              />
              <MenuItem
                icon={FilePlus2}
                title="New document"
                desc="Start from a blank page."
                onSelect={async () => {
                  setOpen(false);
                  await newBlankDocument();
                }}
                testId="documents-new-document"
              />
              <MenuItem
                icon={Upload}
                title="Upload files"
                desc="Files become raw dumps."
                onSelect={() => {
                  setOpen(false);
                  uploadFiles();
                }}
                testId="documents-upload-files"
              />
            </div>
          </PopoverContent>
        </Popover>
        <input
          id="leftnav-upload-hidden"
          type="file"
          multiple
          className="hidden"
          onChange={(e) =>
            e.currentTarget.files && handleSelectedFiles(e.currentTarget.files)
          }
        />
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
              onNavigate={(path) => router.push(path)}
            />
          ))
        )}
      </nav>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  title,
  desc,
  onSelect,
  autoFocus,
  testId,
}: {
  icon: any;
  title: string;
  desc: string;
  onSelect: () => void;
  autoFocus?: boolean;
  testId: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      (ref.current?.nextElementSibling as HTMLElement | null)?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      (ref.current?.previousElementSibling as HTMLElement | null)?.focus();
    }
  };

  return (
    <button
      ref={ref}
      role="menuitem"
      data-testid={testId}
      className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
      onClick={onSelect}
      autoFocus={autoFocus}
      onKeyDown={handleKeyDown}
    >
      <div className="flex gap-3">
        <Icon className="h-4 w-4 mt-1 shrink-0" />
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
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
      <div className="flex items-center">
        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground mr-1"
        >
          {expanded ? "⌄" : "›"}
        </button>
        <button
          onClick={() => onNavigate(`/baskets/${basketId}/documents/${document.id}`)}
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

      {expanded && (
        <div className="ml-6 space-y-1">
          <button
            onClick={() => onNavigate(`/baskets/${basketId}/documents/${document.id}`)}
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
            onClick={() => onNavigate(`/baskets/${basketId}/timeline`)}
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

