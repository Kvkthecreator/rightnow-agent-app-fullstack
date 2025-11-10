"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Database,
  Brain,
  Search,
  Loader2,
  ExternalLink,
  AlertCircle
} from "lucide-react";

interface Block {
  id: string;
  title: string;
  content: string;
  semantic_type: string;
  state: string;
  confidence: number | null;
  times_referenced: number | null;
  created_at: string;
  anchor_role: string | null;
}

interface ContextBlocksClientProps {
  projectId: string;
  basketId: string;
}

export default function ContextBlocksClient({ projectId, basketId }: ContextBlocksClientProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "knowledge" | "meaning">("all");

  // Fetch blocks from BFF
  useEffect(() => {
    async function fetchBlocks() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/context`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          throw new Error(errorData.detail || `Failed to fetch context blocks (${response.status})`);
        }

        const data = await response.json();
        setBlocks(data.blocks || []);
        setError(null);
      } catch (err) {
        console.error("[Context Blocks] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load context");
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [projectId]);

  // Filter blocks
  const filteredBlocks = blocks.filter((block) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        block.title.toLowerCase().includes(query) ||
        block.content.toLowerCase().includes(query) ||
        block.semantic_type.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filter === "knowledge") {
      return ["knowledge", "factual", "metric", "entity"].includes(
        block.semantic_type.toLowerCase()
      );
    }
    if (filter === "meaning") {
      return [
        "intent",
        "objective",
        "rationale",
        "principle",
        "assumption",
        "context",
        "constraint",
      ].includes(block.semantic_type.toLowerCase());
    }

    return true;
  });

  // Stats
  const knowledgeCount = blocks.filter((b) =>
    ["knowledge", "factual", "metric", "entity"].includes(b.semantic_type.toLowerCase())
  ).length;
  const meaningCount = blocks.filter((b) =>
    ["intent", "objective", "rationale", "principle", "assumption", "context", "constraint"].includes(
      b.semantic_type.toLowerCase()
    )
  ).length;

  if (loading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
          <p className="text-slate-600">Loading context blocks...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
          <p className="text-slate-900 font-medium">Failed to Load Context</p>
          <p className="text-slate-600 text-sm mt-2">{error}</p>
          <p className="text-slate-500 text-xs mt-4">
            This may indicate that the basket doesn't exist in substrate-api yet, or there are connectivity issues.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4">
        <Card className="flex-1 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2">
              <Database className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{blocks.length}</p>
              <p className="text-xs text-slate-600">Total Blocks</p>
            </div>
          </div>
        </Card>
        <Card className="flex-1 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{knowledgeCount}</p>
              <p className="text-xs text-slate-600">Knowledge</p>
            </div>
          </div>
        </Card>
        <Card className="flex-1 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{meaningCount}</p>
              <p className="text-xs text-slate-600">Meaning</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search blocks by title, content, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "knowledge" ? "default" : "outline"}
            onClick={() => setFilter("knowledge")}
          >
            Knowledge
          </Button>
          <Button
            variant={filter === "meaning" ? "default" : "outline"}
            onClick={() => setFilter("meaning")}
          >
            Meaning
          </Button>
        </div>
      </div>

      {/* Blocks List */}
      {filteredBlocks.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Database className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No context blocks found</p>
            <p className="text-slate-500 text-sm mt-2">
              {searchQuery || filter !== "all"
                ? "Try adjusting your search or filters"
                : "Add content to your project to build substrate context"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredBlocks.map((block) => (
            <Card key={block.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-medium text-slate-900 flex-1 line-clamp-2">
                  {block.title}
                </h3>
                <Badge variant="outline" className="flex-shrink-0">
                  {block.semantic_type}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                {block.content}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  {block.confidence !== null && (
                    <span>
                      {Math.round(block.confidence * 100)}% confidence
                    </span>
                  )}
                  {block.times_referenced !== null && block.times_referenced > 0 && (
                    <span>{block.times_referenced} refs</span>
                  )}
                </div>
                <a
                  href={`${process.env.NEXT_PUBLIC_SUBSTRATE_URL || 'http://localhost:10000'}/baskets/${basketId}/building-blocks?block=${block.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  <span>View in Substrate</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
