"use client";

import { useState } from "react";
import BrainSidebar from "./BrainSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/useAuth";

interface LiveThinkingPartnerProps {
  basketId: string;
  basketName?: string;
  currentDocumentId?: string;
}

export default function LiveThinkingPartner({ 
  basketId, 
  basketName,
  currentDocumentId 
}: LiveThinkingPartnerProps) {
  const { user } = useAuth();
  const [focusMode, setFocusMode] = useState<"document" | "basket">("basket");

  return (
    <div className="flex h-full w-full">
      {/* Document Canvas Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Live Context Header */}
        <div className="border-b p-4 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                Live Thinking Partner
              </h1>
              <p className="text-sm text-muted-foreground">
                AI working alongside you in {basketName || "this basket"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={focusMode === "basket" ? "default" : "outline"}>
                Basket Context
              </Badge>
              <Badge variant={focusMode === "document" ? "default" : "outline"}>
                Document Focus
              </Badge>
            </div>
          </div>
        </div>

        {/* Document Work Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <DocumentWorkArea 
            basketId={basketId}
            currentDocumentId={currentDocumentId}
            focusMode={focusMode}
            onFocusModeChange={setFocusMode}
          />
        </div>
      </div>

      {/* Brain Sidebar */}
      <BrainSidebar 
        basketId={basketId}
        currentDocumentId={currentDocumentId}
        focusMode={focusMode}
      />
    </div>
  );
}

interface DocumentWorkAreaProps {
  basketId: string;
  currentDocumentId?: string;
  focusMode: "document" | "basket";
  onFocusModeChange: (mode: "document" | "basket") => void;
}

function DocumentWorkArea({ 
  basketId, 
  currentDocumentId, 
  focusMode,
  onFocusModeChange 
}: DocumentWorkAreaProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Context Awareness Indicator */}
      <Card className="p-4 border-dashed border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              🧠 Brain is analyzing your context...
            </p>
            <p className="text-xs text-muted-foreground">
              Real-time intelligence updating in Brain sidebar →
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onFocusModeChange(focusMode === "basket" ? "document" : "basket")}
          >
            Switch to {focusMode === "basket" ? "Document" : "Basket"} Focus
          </Button>
        </div>
      </Card>

      {/* Document Selection/Creation Area */}
      {!currentDocumentId ? (
        <BasketOverview basketId={basketId} />
      ) : (
        <DocumentEditor documentId={currentDocumentId} basketId={basketId} />
      )}
    </div>
  );
}

function BasketOverview({ basketId }: { basketId: string }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">🗂️ Basket Overview</h2>
        <div className="space-y-4">
          <EmptyState 
            title="Select a document to begin intelligent collaboration"
            action={
              <Button size="sm">
                Browse Documents
              </Button>
            }
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-medium mb-3">🎯 Context Readiness</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Basket intelligence active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span>Document-specific analysis pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>Memory insights available</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DocumentEditor({ documentId, basketId }: { documentId: string; basketId: string }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">📝 Document Editor</h2>
          <Badge variant="secondary">Live Analysis Active</Badge>
        </div>
        
        <div className="min-h-[400px] border rounded-lg p-4 bg-muted/20">
          <p className="text-muted-foreground text-center pt-32">
            Document editing canvas would integrate here.
            <br />
            Brain sidebar provides real-time context analysis.
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span>AI is analyzing your content as you work...</span>
        </div>
      </div>
    </Card>
  );
}