"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { useWorkStatusRealtime } from "@/hooks/useWorkStatusRealtime";

// Types from API schemas
interface SubstrateImpact {
  proposals_created: number;
  substrate_created: {
    blocks: number;
    context_items: number;
  };
  relationships_mapped: number;
  artifacts_generated: number;
}

interface CascadeFlow {
  active: boolean;
  current_stage?: string;
  completed_stages: string[];
  next_stage?: string;
}

interface WorkError {
  code: string;
  message: string;
  recovery_actions: string[];
}

interface WorkStatusData {
  work_id: string;
  work_type: string;
  status: string;
  processing_stage?: string;
  progress_percentage: number;
  basket_id?: string;
  workspace_id: string;
  user_id: string;
  started_at: string;
  last_activity: string;
  estimated_completion?: string;
  substrate_impact: SubstrateImpact;
  cascade_flow: CascadeFlow;
  error?: WorkError;
}

export interface UniversalWorkStatusProps {
  /** Work ID to track status for */
  workId: string;
  /** Show cascade flow visualization */
  showCascadeFlow?: boolean;
  /** Show substrate impact metrics */
  showSubstrateImpact?: boolean;
  /** Enable real-time updates via WebSocket */
  enableRealtime?: boolean;
  /** Poll interval in milliseconds (fallback when WebSocket unavailable) */
  pollInterval?: number;
  /** Custom CSS class */
  className?: string;
  /** Callback when status changes */
  onStatusChange?: (status: WorkStatusData) => void;
}

/**
 * Universal Work Status Component - YARNNN Canon v2.1 Compliant
 * 
 * Provides real-time status tracking for all async work in YARNNN:
 * - P0-P4 pipeline operations
 * - Manual substrate edits
 * - Governance proposal reviews
 * - Document composition
 * - Timeline restoration
 * 
 * Canon Compliance:
 * - Memory-first architecture with substrate impact visualization
 * - Cascade flow tracking for P1→P2→P3 pipeline operations
 * - Workspace isolation via JWT authentication
 * - Event-driven updates reflecting timeline consistency
 */
export function UniversalWorkStatus({
  workId,
  showCascadeFlow = true,
  showSubstrateImpact = true,
  enableRealtime = true,
  pollInterval = 2000,
  className,
  onStatusChange
}: UniversalWorkStatusProps) {
  // Use real-time hook for status tracking
  const {
    status,
    loading,
    error,
    connectionStatus,
    isConnected,
    isUsingRealtime,
    refresh,
    retryWork
  } = useWorkStatusRealtime(workId, {
    enableRealtime,
    pollInterval,
    autoStart: true
  });

  // Notify parent component of status changes
  useEffect(() => {
    if (onStatusChange && status) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "success" | "warning" | "destructive" => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'processing':
      case 'cascading':
        return 'default';
      case 'claimed':
        return 'secondary';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Format work type for display
  const formatWorkType = (workType: string): string => {
    return workType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get progress bar color
  const getProgressColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
      case 'cascading':
        return 'bg-blue-500';
      case 'claimed':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Spinner />
            <span className="text-muted-foreground">Loading work status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="text-red-500 font-medium mb-2">Error loading work status</div>
            <div className="text-muted-foreground text-sm">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {formatWorkType(status.work_type)} 
              {status.processing_stage && (
                <span className="text-muted-foreground font-normal"> • {status.processing_stage}</span>
              )}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {status.work_id}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(status.status)}>
              {status.status.toUpperCase()}
            </Badge>
            {/* Real-time Connection Status */}
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-xs text-muted-foreground">
                {isUsingRealtime ? "Live" : "Polling"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{status.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn("h-2 rounded-full transition-all duration-300", getProgressColor(status.status))}
              style={{ width: `${status.progress_percentage}%` }}
            />
          </div>
          {status.estimated_completion && (
            <div className="text-xs text-muted-foreground mt-1">
              Estimated completion: {status.estimated_completion}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cascade Flow Visualization */}
        {showCascadeFlow && status.cascade_flow.active && (
          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
            <h4 className="font-medium text-sm mb-3">Cascade Flow Status</h4>
            <div className="flex items-center gap-2">
              {status.cascade_flow.completed_stages.map(stage => (
                <div key={stage} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs font-medium">{stage}</span>
                  <span className="text-gray-400">→</span>
                </div>
              ))}
              
              {status.cascade_flow.current_stage && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-medium">{status.cascade_flow.current_stage}</span>
                  {status.cascade_flow.next_stage && (
                    <>
                      <span className="text-gray-400">→</span>
                      <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                      <span className="text-xs text-muted-foreground">{status.cascade_flow.next_stage}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Substrate Impact */}
        {showSubstrateImpact && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3">Substrate Impact</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold">{status.substrate_impact.proposals_created}</div>
                <div className="text-xs text-muted-foreground">Proposals</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {status.substrate_impact.substrate_created.blocks + status.substrate_impact.substrate_created.context_items}
                </div>
                <div className="text-xs text-muted-foreground">Substrate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{status.substrate_impact.relationships_mapped}</div>
                <div className="text-xs text-muted-foreground">Relationships</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{status.substrate_impact.artifacts_generated}</div>
                <div className="text-xs text-muted-foreground">Artifacts</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Information */}
        {status.error && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
            <h4 className="font-medium text-sm text-red-900 dark:text-red-100 mb-2">
              Error: {status.error.code}
            </h4>
            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
              {status.error.message}
            </p>
            {status.error.recovery_actions.length > 0 && (
              <div>
                <div className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  Recovery Actions:
                </div>
                <ul className="text-sm text-red-800 dark:text-red-200 list-disc list-inside">
                  {status.error.recovery_actions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Timing Information */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>Started: {new Date(status.started_at).toLocaleString()}</div>
            <div>Last Activity: {new Date(status.last_activity).toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UniversalWorkStatus;