"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Clock, Brain, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CompositionStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: string;
  progress?: number;
  substrate_count?: number;
  error?: string;
  summary?: string;
  started_at?: string;
  completed_at?: string;
}

interface DocumentCompositionStatusProps {
  documentId: string;
  workId?: string;
  statusUrl?: string;
  onCompositionComplete?: () => void;
}

const STAGES = [
  { key: 'analyzing', label: 'Analyzing Intent', icon: Brain },
  { key: 'querying', label: 'Finding Substrate', icon: FileText },
  { key: 'selecting', label: 'Selecting Best Content', icon: Zap },
  { key: 'composing', label: 'Generating Document', icon: RefreshCw }
];

export function DocumentCompositionStatus({
  documentId,
  workId,
  statusUrl,
  onCompositionComplete
}: DocumentCompositionStatusProps) {
  const [status, setStatus] = useState<CompositionStatus>({ status: 'pending' });
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!workId || !statusUrl) return;

    // Start polling for status
    setPolling(true);
    const pollStatus = async () => {
      try {
        const res = await fetch(statusUrl);
        if (res.ok) {
          const data = await res.json();
          
          const newStatus: CompositionStatus = {
            status: data.status === 'completed' ? 'completed' : 
                   data.status === 'failed' ? 'failed' :
                   data.status === 'processing' ? 'processing' : 'pending',
            stage: data.processing_stage,
            progress: data.progress_percentage || 0,
            substrate_count: data.substrate_impact?.substrate_count,
            error: data.error?.message,
            summary: data.substrate_impact?.summary,
            started_at: data.started_at,
            completed_at: data.status === 'completed' ? new Date().toISOString() : undefined
          };

          setStatus(newStatus);

          // Stop polling if completed or failed
          if (newStatus.status === 'completed') {
            setPolling(false);
            
            // Show global notification
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('yarnnn-notification', {
                detail: {
                  type: 'change_applied',
                  title: 'Document Composed',
                  message: `${newStatus.substrate_count ? `Successfully composed with ${newStatus.substrate_count} substrate items` : 'Document composition complete'}`,
                  timestamp: new Date().toISOString(),
                  autoHide: true
                }
              }));
            }
            
            onCompositionComplete?.();
          } else if (newStatus.status === 'failed') {
            setPolling(false);
            
            // Show error notification
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('yarnnn-notification', {
                detail: {
                  type: 'change_failed',
                  title: 'Composition Failed',
                  message: newStatus.error || 'Document composition encountered an error',
                  timestamp: new Date().toISOString(),
                  autoHide: false
                }
              }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to poll composition status:', e);
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 3000);

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [workId, statusUrl, onCompositionComplete]);

  const getCurrentStageIndex = () => {
    if (!status.stage) return 0;
    const stageMap: Record<string, number> = {
      'intent_analysis': 0,
      'substrate_query': 1,
      'substrate_selection': 2,
      'document_composition': 3
    };
    return stageMap[status.stage] || 0;
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (status.status) {
      case 'completed':
        return `Document composed successfully${status.substrate_count ? ` with ${status.substrate_count} substrate items` : ''}`;
      case 'failed':
        return `Composition failed: ${status.error || 'Unknown error'}`;
      case 'processing':
        return `Composing your document... ${status.progress || 0}%`;
      default:
        return 'Composition queued';
    }
  };

  if (status.status === 'completed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">Document composition complete!</p>
            <p className="text-green-700 text-sm mt-1">{getStatusMessage()}</p>
            {status.summary && (
              <p className="text-green-600 text-sm mt-2 italic">{status.summary}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status.status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Composition failed</p>
            <p className="text-red-700 text-sm mt-1">{status.error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Processing or pending state
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
        <div className="flex-1">
          <p className="text-blue-800 font-medium">Composing your document...</p>
          <p className="text-blue-700 text-sm mt-1">
            Our AI is thoughtfully selecting and organizing content from your memory.
          </p>
        </div>
      </div>

      {/* Progress stages */}
      <div className="space-y-2">
        {STAGES.map((stage, index) => {
          const currentIndex = getCurrentStageIndex();
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const Icon = stage.icon;

          return (
            <div 
              key={stage.key}
              className={`flex items-center gap-3 p-2 rounded transition-colors ${
                isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${
                isActive ? 'text-blue-600 animate-pulse' : 
                isCompleted ? 'text-green-600' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${
                isActive ? 'text-blue-800 font-medium' : 
                isCompleted ? 'text-green-800' : 'text-gray-600'
              }`}>
                {stage.label}
                {isActive && status.progress && ` (${status.progress}%)`}
              </span>
              {isCompleted && <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {status.progress && status.progress > 0 && (
        <div className="mt-4">
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(status.progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-blue-600 flex items-center gap-2">
        <Clock className="w-3 h-3" />
        <span>This usually takes 30-60 seconds</span>
      </div>
    </div>
  );
}