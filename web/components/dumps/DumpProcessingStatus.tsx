'use client';

import { useState, useEffect } from 'react';
import { UniversalWorkStatus } from '@/components/work/UniversalWorkStatus';
import { InlineWorkStatus } from '@/components/work/InlineWorkStatus';
import { useWorkStatusRealtime } from '@/hooks/useWorkStatusRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface DumpProcessingStatusProps {
  dumpId: string;
  basketId?: string;
  /** Show compact inline view instead of full card */
  compact?: boolean;
  /** Enable real-time updates */
  enableRealtime?: boolean;
  /** Callback when processing completes */
  onComplete?: (status: any) => void;
  /** Callback when processing fails */
  onError?: (error: Error) => void;
  /** Custom CSS class */
  className?: string;
}

interface DumpWorkMapping {
  dump_id: string;
  work_id: string;
  work_type: string;
  created_at: string;
}

/**
 * Dump Processing Status - Canon v2.1 Compliant
 * 
 * Integrates dump processing with the universal work orchestration system.
 * Shows real-time status for P0→P1→P2→P3 pipeline processing triggered by dump uploads.
 * 
 * Features:
 * - Real-time status updates via WebSocket
 * - Cascade flow visualization for P1→P2→P3
 * - Substrate impact tracking
 * - Error handling with recovery actions
 * - Both compact and detailed views
 */
export default function DumpProcessingStatus({ 
  dumpId, 
  basketId,
  compact = false,
  enableRealtime = true,
  onComplete, 
  onError,
  className
}: DumpProcessingStatusProps) {
  const [workMappings, setWorkMappings] = useState<DumpWorkMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch work IDs associated with this dump
  useEffect(() => {
    const fetchWorkMappings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query the agent_processing_queue for work related to this dump
        const response = await fetch(`/api/dumps/${dumpId}/work`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // No work found yet, this is normal for newly uploaded dumps
            setWorkMappings([]);
          } else {
            throw new Error(`Failed to fetch work mappings: ${response.statusText}`);
          }
        } else {
          const data = await response.json();
          setWorkMappings(data.work_mappings || []);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load processing status';
        setError(errorMessage);
        if (onError) {
          onError(err as Error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkMappings();
    
    // Poll for work mappings every 5 seconds until we find some
    const interval = workMappings.length === 0 ? setInterval(fetchWorkMappings, 5000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dumpId, workMappings.length, onError]);

  // Loading state
  if (loading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("border-red-200", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <div className="font-medium mb-2">Error loading processing status</div>
            <div className="text-sm text-red-500">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No work found yet
  if (workMappings.length === 0) {
    return (
      <Card className={cn("border-yellow-200 bg-yellow-50", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-yellow-800">
            <div className="font-medium mb-2">⏳ Preparing for processing</div>
            <div className="text-sm">Your dump is being queued for pipeline processing...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort work by pipeline stage order (P0, P1, P2, P3)
  const sortedWork = workMappings.sort((a, b) => {
    const order = { 'P0_CAPTURE': 0, 'P1_SUBSTRATE': 1, 'P2_GRAPH': 2, 'P3_REFLECTION': 3 };
    return (order[a.work_type as keyof typeof order] || 999) - (order[b.work_type as keyof typeof order] || 999);
  });

  // Compact view - show only the most recent/active work
  if (compact) {
    const activeWork = sortedWork.find(w => !['completed', 'failed'].includes(w.work_type)) || sortedWork[sortedWork.length - 1];
    
    return (
      <div className={className}>
        <InlineWorkStatus 
          workId={activeWork.work_id}
          showProgress={true}
          pollInterval={enableRealtime ? 2000 : 5000}
          size="md"
        />
      </div>
    );
  }

  // Full detailed view
  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Dump Processing Pipeline</span>
            <Badge variant="secondary" className="text-xs">
              {sortedWork.length} stages
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedWork.map((work, index) => (
            <div key={work.work_id} className="relative">
              {/* Pipeline Stage Indicator */}
              {index < sortedWork.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-200 z-0" />
              )}
              
              {/* Work Status */}
              <UniversalWorkStatus
                workId={work.work_id}
                enableRealtime={enableRealtime}
                showCascadeFlow={true}
                showSubstrateImpact={true}
                onStatusChange={(status) => {
                  if (status.status === 'completed' && onComplete) {
                    onComplete(status);
                  }
                }}
                className="relative z-10"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/baskets/${basketId}/overview`, '_blank')}
          disabled={!basketId}
        >
          View in Memory
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => basketId ? window.open(`/baskets/${basketId}/timeline`, '_blank') : window.open('/baskets','_blank')}
        >
          Open Timeline
        </Button>
      </div>
    </div>
  );
}
