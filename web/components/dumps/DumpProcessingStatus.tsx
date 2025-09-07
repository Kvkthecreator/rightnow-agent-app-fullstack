'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProcessingStatus {
  dump_id: string;
  stage: 'uploaded' | 'queued' | 'analyzing' | 'substrate_created' | 'linking' | 'reflecting' | 'awaiting_review' | 'completed' | 'failed';
  stage_display: string;
  current_pipeline_stage?: string;
  queue_position?: number;
  started_at: string;
  last_activity: string;
  cascade_active: boolean;
  progress_percentage: number;
  meta: {
    proposals_created: number;
    proposals_executed: number;
    substrate_created: {
      blocks: number;
      context_items: number;
    };
    queue_entries: number;
    error?: string;
  };
  estimated_time_remaining: string;
  average_total_time: string;
}

interface DumpProcessingStatusProps {
  dumpId: string;
  onComplete?: (status: ProcessingStatus) => void;
  onError?: (error: Error) => void;
  pollingInterval?: number;
}

const stageColors = {
  uploaded: 'text-gray-500 bg-gray-50',
  queued: 'text-yellow-700 bg-yellow-50',
  analyzing: 'text-blue-700 bg-blue-50 animate-pulse',
  substrate_created: 'text-purple-700 bg-purple-50',
  linking: 'text-indigo-700 bg-indigo-50 animate-pulse',
  reflecting: 'text-pink-700 bg-pink-50 animate-pulse',
  awaiting_review: 'text-orange-700 bg-orange-50',
  completed: 'text-green-700 bg-green-50',
  failed: 'text-red-700 bg-red-50'
};

const stageIcons = {
  uploaded: '📤',
  queued: '⏳',
  analyzing: '🔬',
  substrate_created: '🧱',
  linking: '🔗',
  reflecting: '💭',
  awaiting_review: '👁️',
  completed: '✅',
  failed: '❌'
};

export default function DumpProcessingStatus({ 
  dumpId, 
  onComplete, 
  onError,
  pollingInterval = 2000 
}: DumpProcessingStatusProps) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!dumpId || !isPolling) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/dumps/${dumpId}/status`, {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Status fetch failed: ${response.statusText}`);
        }

        const newStatus = await response.json() as ProcessingStatus;
        setStatus(newStatus);

        // Stop polling if completed or failed
        if (newStatus.stage === 'completed' || newStatus.stage === 'failed') {
          setIsPolling(false);
          if (newStatus.stage === 'completed' && onComplete) {
            onComplete(newStatus);
          }
        }
      } catch (err) {
        console.error('Failed to fetch processing status:', err);
        if (onError) {
          onError(err as Error);
        }
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling
    const interval = setInterval(fetchStatus, pollingInterval);

    return () => clearInterval(interval);
  }, [dumpId, isPolling, pollingInterval, supabase, onComplete, onError]);

  if (!status) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const { stage, stage_display, progress_percentage, meta, estimated_time_remaining } = status;
  const colorClass = stageColors[stage];
  const icon = stageIcons[stage];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Main Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
              {stage_display}
            </h3>
            {status.current_pipeline_stage && (
              <p className="text-xs text-gray-500 mt-1">{status.current_pipeline_stage}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">{estimated_time_remaining}</p>
          {status.queue_position && (
            <p className="text-xs text-gray-500">Position #{status.queue_position}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              stage === 'failed' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="text-gray-500">Proposals</p>
          <p className="font-semibold">{meta.proposals_created}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Blocks</p>
          <p className="font-semibold">{meta.substrate_created.blocks}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Context Items</p>
          <p className="font-semibold">{meta.substrate_created.context_items}</p>
        </div>
      </div>

      {/* Cascade Indicator */}
      {status.cascade_active && stage !== 'completed' && (
        <div className="mt-3 flex items-center text-xs text-blue-600">
          <svg className="animate-spin mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Pipeline cascade active
        </div>
      )}

      {/* Error Display */}
      {meta.error && (
        <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
          {meta.error}
        </div>
      )}
    </div>
  );
}