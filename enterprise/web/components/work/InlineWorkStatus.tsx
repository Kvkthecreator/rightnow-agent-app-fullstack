"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface WorkStatusData {
  work_id: string;
  work_type: string;
  status: string;
  progress_percentage: number;
  estimated_completion?: string;
}

export interface InlineWorkStatusProps {
  /** Work ID to track status for */
  workId: string;
  /** Show progress percentage */
  showProgress?: boolean;
  /** Poll interval in milliseconds */
  pollInterval?: number;
  /** Custom CSS class */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Inline Work Status Component - Compact version for embedding in other components
 * 
 * Provides lightweight status tracking without full card UI.
 * Perfect for displaying work status in lists or other condensed views.
 */
export function InlineWorkStatus({
  workId,
  showProgress = true,
  pollInterval = 5000,
  className,
  size = "md"
}: InlineWorkStatusProps) {
  const [status, setStatus] = useState<WorkStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch work status from API
  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/work/status/${workId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Not found');
        } else if (response.status === 403) {
          throw new Error('Access denied');
        } else {
          throw new Error('Failed to fetch');
        }
      }

      const data: WorkStatusData = await response.json();
      setStatus(data);
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Set up polling
  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(() => {
      // Only poll if work is not in terminal state
      if (status && !['completed', 'failed'].includes(status.status)) {
        fetchStatus();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [workId, pollInterval, status?.status]);

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

  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-2", 
    lg: "text-base gap-3"
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn("flex items-center", sizeClasses[size], className)}>
        <Spinner className="w-4 h-4" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("flex items-center", sizeClasses[size], className)}>
        <Badge variant="destructive" className={size === "sm" ? "text-xs" : ""}>
          ERROR
        </Badge>
        <span className="text-muted-foreground">{error}</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className={cn("flex items-center", sizeClasses[size], className)}>
      <Badge variant={getStatusVariant(status.status)} className={size === "sm" ? "text-xs" : ""}>
        {status.status.toUpperCase()}
      </Badge>
      
      <span className="text-muted-foreground truncate">
        {formatWorkType(status.work_type)}
      </span>

      {showProgress && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className={cn(
            "bg-gray-200 rounded-full",
            size === "sm" ? "w-12 h-1" : size === "lg" ? "w-20 h-2" : "w-16 h-1.5"
          )}>
            <div 
              className={cn(
                "rounded-full transition-all duration-300",
                getProgressColor(status.status),
                size === "sm" ? "h-1" : size === "lg" ? "h-2" : "h-1.5"
              )}
              style={{ width: `${status.progress_percentage}%` }}
            />
          </div>
          <span className="text-muted-foreground font-mono">
            {status.progress_percentage}%
          </span>
        </div>
      )}

      {status.estimated_completion && status.status !== 'completed' && (
        <span className="text-muted-foreground text-xs flex-shrink-0">
          ~{status.estimated_completion}
        </span>
      )}
    </div>
  );
}

export default InlineWorkStatus;
