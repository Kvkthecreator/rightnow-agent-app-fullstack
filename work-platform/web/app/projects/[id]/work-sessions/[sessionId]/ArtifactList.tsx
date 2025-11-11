"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Copy, CheckCircle } from "lucide-react";

interface Artifact {
  id: string;
  artifact_type: string;
  content: any;
  agent_confidence: number | null;
  agent_reasoning: string | null;
  status: string;
  created_at: string;
}

interface ArtifactListProps {
  artifacts: Artifact[];
}

export default function ArtifactList({ artifacts }: ArtifactListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (artifact: Artifact) => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(artifact.content, null, 2)
      );
      setCopiedId(artifact.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (artifacts.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-sm text-center">
          No artifacts generated yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {artifacts.map((artifact) => (
        <Card key={artifact.id} className="p-6">
          <details open>
            <summary className="cursor-pointer font-medium text-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-base">{artifact.artifact_type}</span>
                {artifact.agent_confidence !== null && (
                  <span className="text-sm text-muted-foreground">
                    {Math.round(artifact.agent_confidence * 100)}% confidence
                  </span>
                )}
                <Badge variant="secondary" className="text-[11px] capitalize">
                  {artifact.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  handleCopy(artifact);
                }}
                className="gap-2"
              >
                {copiedId === artifact.id ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy JSON
                  </>
                )}
              </Button>
            </summary>

            <div className="mt-4 space-y-3">
              {/* Raw JSON Content */}
              <div>
                <h4 className="text-sm font-medium text-foreground/80 mb-2">
                  Content:
                </h4>
                <pre className="text-xs bg-muted p-3 rounded border border-border overflow-auto max-h-96">
                  {JSON.stringify(artifact.content, null, 2)}
                </pre>
              </div>

              {/* Agent Reasoning */}
              {artifact.agent_reasoning && (
                <div>
                  <h4 className="text-sm font-medium text-foreground/80 mb-2">
                    💭 Agent Reasoning:
                  </h4>
                  <p className="text-sm text-muted-foreground rounded border border-surface-primary-border bg-surface-primary p-3">
                    {artifact.agent_reasoning}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                <span>ID: {artifact.id.slice(0, 8)}...</span>
                <span>
                  Created: {new Date(artifact.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </details>
        </Card>
      ))}
    </div>
  );
}
