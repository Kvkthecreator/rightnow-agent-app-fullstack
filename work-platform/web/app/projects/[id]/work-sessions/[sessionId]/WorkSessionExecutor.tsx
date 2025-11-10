"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface WorkSessionExecutorProps {
  projectId: string;
  sessionId: string;
  initialStatus: string;
  initialArtifactsCount?: number;
}

interface SessionStatus {
  session_id: string;
  status: string;
  artifacts_count: number;
  checkpoints: Array<{
    id: string;
    reason: string;
    status: string;
    created_at: string;
  }>;
  metadata: any;
}

export default function WorkSessionExecutor({
  projectId,
  sessionId,
  initialStatus,
  initialArtifactsCount = 0,
}: WorkSessionExecutorProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [artifactsCount, setArtifactsCount] = useState(initialArtifactsCount);
  const [checkpoints, setCheckpoints] = useState<SessionStatus["checkpoints"]>([]);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // Poll for status updates when executing
  useEffect(() => {
    if (status === "in_progress" || status === "initialized" && polling) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(
            `/api/projects/${projectId}/work-sessions/${sessionId}/status`
          );

          if (response.ok) {
            const data: SessionStatus = await response.json();
            setStatus(data.status);
            setArtifactsCount(data.artifacts_count);
            setCheckpoints(data.checkpoints || []);

            // Stop polling when terminal status reached
            if (["completed", "failed", "pending_review"].includes(data.status)) {
              setPolling(false);
              setExecuting(false);
              router.refresh(); // Refresh server component
            }
          }
        } catch (err) {
          console.error("Failed to poll status:", err);
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [status, polling, projectId, sessionId, router]);

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);
    setPolling(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/work-sessions/${sessionId}/execute`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to execute work session",
        }));
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : "Failed to execute work session"
        );
      }

      const result = await response.json();
      setStatus(result.status);

      if (result.status === "failed") {
        setError(result.error || "Execution failed");
        setExecuting(false);
        setPolling(false);
      } else if (result.status === "completed") {
        setArtifactsCount(result.artifacts_count);
        setExecuting(false);
        setPolling(false);
        router.refresh();
      } else if (result.status === "checkpoint_required") {
        setArtifactsCount(result.artifacts_count);
        setExecuting(false);
        setPolling(false);
        router.refresh();
      }
      // If status is in_progress, polling will handle updates
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to execute work session";
      setError(message);
      setExecuting(false);
      setPolling(false);
    }
  };

  // Show execute button only for initialized status
  if (status === "initialized") {
    return (
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Play className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Ready to Execute</h3>
              <p className="text-sm text-blue-700 mt-1">
                This work session is ready. Click Execute to start the agent.
              </p>
              {error && (
                <div className="mt-3 flex items-start gap-2 text-red-700 bg-red-100 p-3 rounded">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={handleExecute}
            disabled={executing}
            className="gap-2"
            size="lg"
          >
            {executing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Execute Work Session
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  // Show execution status for in_progress
  if (status === "in_progress") {
    return (
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          <div>
            <h3 className="font-semibold text-blue-900">Agent is executing your task</h3>
            <p className="text-sm text-blue-700 mt-1">
              The agent is actively working on your request. Results will appear when completed.
            </p>
            {artifactsCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
                <FileText className="h-4 w-4" />
                <span>{artifactsCount} artifact{artifactsCount !== 1 ? 's' : ''} created so far</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Show pending review status for checkpoint
  if (status === "pending_review") {
    return (
      <Card className="p-6 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Clock className="h-6 w-6 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Checkpoint - Review Required</h3>
            <p className="text-sm text-amber-700 mt-1">
              The agent has paused for your review before continuing.
            </p>
            {artifactsCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-amber-700">
                <FileText className="h-4 w-4" />
                <span>{artifactsCount} artifact{artifactsCount !== 1 ? 's' : ''} created</span>
              </div>
            )}
            {checkpoints.length > 0 && (
              <div className="mt-3 space-y-2">
                {checkpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="bg-white border border-amber-200 rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-amber-900">
                        Checkpoint
                      </span>
                      <Badge variant="outline">{checkpoint.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">{checkpoint.reason}</p>
                    {/* TODO: Add approve/reject buttons in Phase 3 */}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Show completed status
  if (status === "completed") {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Task Completed Successfully</h3>
            <p className="text-sm text-green-700 mt-1">
              The agent has successfully completed your task.
            </p>
            {artifactsCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                <FileText className="h-4 w-4" />
                <span>{artifactsCount} artifact{artifactsCount !== 1 ? 's' : ''} generated</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Show failed status
  if (status === "failed") {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Execution Failed</h3>
            <p className="text-sm text-red-700 mt-1">
              The agent encountered an error during execution.
            </p>
            {error && (
              <p className="text-sm text-red-700 mt-2 font-mono bg-red-100 p-2 rounded">
                {error}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Fallback for other statuses
  return null;
}
