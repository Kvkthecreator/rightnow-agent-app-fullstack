"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitMerge, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Eye,
  Zap,
  Brain
} from 'lucide-react';
import type { 
  DetectedConflict, 
  ConflictResolutionStrategy,
  ChangeVector 
} from '@/lib/collaboration/ConflictDetectionEngine';

export interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflicts: DetectedConflict[];
  strategies: ConflictResolutionStrategy[];
  documentId: string;
  onResolve: (resolutions: ConflictResolution[]) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export interface ConflictResolution {
  conflictId: string;
  strategyId: string;
  userChoice?: 'current' | 'incoming' | 'custom';
  customContent?: string;
  mergeDecisions?: MergeDecision[];
}

export interface MergeDecision {
  section: string;
  choice: 'current' | 'incoming' | 'both' | 'custom';
  customValue?: string;
}

/**
 * Advanced Conflict Resolution Modal
 * 
 * Features:
 * - Side-by-side conflict comparison
 * - Intelligent merge strategies
 * - Real-time preview of resolution
 * - User preference learning
 * - Collaborative conflict analytics
 * - Advanced merge tools
 */
export function ConflictResolutionModal({
  isOpen,
  conflicts,
  strategies,
  documentId,
  onResolve,
  onCancel,
  className = ''
}: ConflictResolutionModalProps) {
  const [selectedConflictIndex, setSelectedConflictIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [previewMode, setPreviewMode] = useState<'split' | 'unified' | 'diff'>('split');
  const [isResolving, setIsResolving] = useState(false);

  // Current conflict and suggested strategies
  const currentConflict = conflicts[selectedConflictIndex];
  const currentStrategies = strategies.filter(s => 
    strategies.length > 0 ? true : false // All strategies for now
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedConflictIndex(0);
      setResolutions(new Map());
      setIsResolving(false);
    }
  }, [isOpen]);

  // Check if all conflicts are resolved
  const allResolved = useMemo(() => {
    return conflicts.every(conflict => resolutions.has(conflict.id));
  }, [conflicts, resolutions]);

  const handleStrategySelect = (conflictId: string, strategy: ConflictResolutionStrategy) => {
    const resolution: ConflictResolution = {
      conflictId,
      strategyId: strategy.id,
      userChoice: strategy.strategy === 'user_select' ? 'current' : undefined
    };

    setResolutions(prev => new Map(prev.set(conflictId, resolution)));
  };

  const handleCustomResolution = (conflictId: string, customContent: string) => {
    const currentResolution = resolutions.get(conflictId);
    if (currentResolution) {
      const updated: ConflictResolution = {
        ...currentResolution,
        userChoice: 'custom',
        customContent
      };
      setResolutions(prev => new Map(prev.set(conflictId, updated)));
    }
  };

  const handleResolveAll = async () => {
    setIsResolving(true);
    try {
      const resolutionArray = Array.from(resolutions.values());
      await onResolve(resolutionArray);
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
    } finally {
      setIsResolving(false);
    }
  };

  if (!isOpen || conflicts.length === 0) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <GitMerge className="text-red-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Resolve Editing Conflicts
              </h2>
              <p className="text-sm text-gray-600">
                {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected in collaborative editing
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResolveAll}
              disabled={!allResolved || isResolving}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all
                ${allResolved && !isResolving
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isResolving ? 'Resolving...' : `Resolve All (${resolutions.size}/${conflicts.length})`}
            </button>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Conflict List Sidebar */}
          <div className="w-80 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Conflicts</h3>
              <div className="space-y-2">
                {conflicts.map((conflict, index) => (
                  <ConflictCard
                    key={conflict.id}
                    conflict={conflict}
                    isSelected={index === selectedConflictIndex}
                    isResolved={resolutions.has(conflict.id)}
                    onClick={() => setSelectedConflictIndex(index)}
                  />
                ))}
              </div>
            </div>

            {/* Resolution Strategies */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Suggested Solutions</h3>
              <div className="space-y-2">
                {currentStrategies.map(strategy => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    isSelected={resolutions.get(currentConflict?.id)?.strategyId === strategy.id}
                    onClick={() => currentConflict && handleStrategySelect(currentConflict.id, strategy)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <div className="flex rounded-lg border border-gray-300">
                  {(['split', 'unified', 'diff'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setPreviewMode(mode)}
                      className={`
                        px-3 py-1 text-xs font-medium capitalize transition-colors
                        ${previewMode === mode
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-blue-600'
                        }
                      `}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {currentConflict && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    {currentConflict.affectedUsers.length} users
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatTimeAgo(currentConflict.detectionTime)}
                  </div>
                </div>
              )}
            </div>

            {/* Conflict Resolution Content */}
            <div className="flex-1 overflow-hidden">
              {currentConflict ? (
                <ConflictResolutionContent
                  conflict={currentConflict}
                  resolution={resolutions.get(currentConflict.id)}
                  previewMode={previewMode}
                  onCustomResolution={(content) => handleCustomResolution(currentConflict.id, content)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a conflict to resolve
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual conflict card in sidebar
 */
function ConflictCard({
  conflict,
  isSelected,
  isResolved,
  onClick
}: {
  conflict: DetectedConflict;
  isSelected: boolean;
  isResolved: boolean;
  onClick: () => void;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityColor(conflict.severity)}`}>
              {conflict.severity}
            </span>
            {isResolved && (
              <CheckCircle size={14} className="text-green-600" />
            )}
          </div>
          
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {conflict.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h4>
          
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {conflict.description}
          </p>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Users size={12} />
            {conflict.affectedUsers.length} users
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Strategy recommendation card
 */
function StrategyCard({
  strategy,
  isSelected,
  onClick
}: {
  strategy: ConflictResolutionStrategy;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getStrategyIcon = (strategyType: string) => {
    switch (strategyType) {
      case 'auto_merge': return <Zap size={16} className="text-green-600" />;
      case 'operational_transform': return <Brain size={16} className="text-blue-600" />;
      case 'user_select': return <Eye size={16} className="text-orange-600" />;
      case 'three_way_merge': return <GitMerge size={16} className="text-purple-600" />;
      default: return <AlertTriangle size={16} className="text-gray-600" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
      `}
    >
      <div className="flex items-start gap-2">
        {getStrategyIcon(strategy.strategy)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {strategy.strategy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round(strategy.confidence * 100)}%
            </span>
          </div>
          
          <p className="text-xs text-gray-600 mt-1">
            {strategy.description}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className={`
              text-xs px-2 py-0.5 rounded
              ${strategy.requiresUserInput 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-green-100 text-green-700'
              }
            `}>
              {strategy.requiresUserInput ? 'Manual' : 'Automatic'}
            </span>
            
            <span className="text-xs text-gray-500">
              ~{strategy.estimatedTime}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main conflict resolution content area
 */
function ConflictResolutionContent({
  conflict,
  resolution,
  previewMode,
  onCustomResolution
}: {
  conflict: DetectedConflict;
  resolution?: ConflictResolution;
  previewMode: 'split' | 'unified' | 'diff';
  onCustomResolution: (content: string) => void;
}) {
  const [customContent, setCustomContent] = useState('');

  // Extract content for comparison
  const currentValue = conflict.conflictData.currentValue || '';
  const incomingValue = conflict.conflictData.incomingValues[0]?.value || '';

  useEffect(() => {
    if (resolution?.customContent) {
      setCustomContent(resolution.customContent);
    }
  }, [resolution]);

  if (previewMode === 'split') {
    return (
      <div className="h-full flex">
        {/* Current Version */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="p-3 bg-blue-50 border-b border-gray-200">
            <h4 className="font-medium text-blue-900">Current Version</h4>
            <p className="text-sm text-blue-700">Your current content</p>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {currentValue}
            </pre>
          </div>
        </div>

        {/* Incoming Version */}
        <div className="flex-1 flex flex-col">
          <div className="p-3 bg-green-50 border-b border-gray-200">
            <h4 className="font-medium text-green-900">Incoming Version</h4>
            <p className="text-sm text-green-700">
              From {conflict.affectedUsers.find(u => u !== 'current_user') || 'another user'}
            </p>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {incomingValue}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (previewMode === 'unified') {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 bg-purple-50 border-b border-gray-200">
          <h4 className="font-medium text-purple-900">Unified Resolution</h4>
          <p className="text-sm text-purple-700">Edit to create your preferred version</p>
        </div>
        
        <div className="flex-1 p-4">
          <textarea
            value={customContent || currentValue}
            onChange={(e) => {
              setCustomContent(e.target.value);
              onCustomResolution(e.target.value);
            }}
            className="w-full h-full p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Edit the content to resolve the conflict..."
          />
        </div>
      </div>
    );
  }

  // Diff mode
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 bg-yellow-50 border-b border-gray-200">
        <h4 className="font-medium text-yellow-900">Difference View</h4>
        <p className="text-sm text-yellow-700">Red = removed, Green = added</p>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        <DiffViewer
          oldText={currentValue}
          newText={incomingValue}
        />
      </div>
    </div>
  );
}

/**
 * Simple diff viewer component
 */
function DiffViewer({ oldText, newText }: { oldText: string; newText: string }) {
  // Simple word-level diff - in production use a more sophisticated diff library
  const words1 = oldText.split(/(\s+)/);
  const words2 = newText.split(/(\s+)/);
  
  return (
    <div className="font-mono text-sm">
      <div className="mb-4">
        <h5 className="font-medium text-red-700 mb-2">- Removed</h5>
        <div className="bg-red-50 p-3 rounded border">
          {words1.map((word, i) => (
            <span key={i} className={word.trim() ? 'bg-red-200' : ''}>{word}</span>
          ))}
        </div>
      </div>
      
      <div>
        <h5 className="font-medium text-green-700 mb-2">+ Added</h5>
        <div className="bg-green-50 p-3 rounded border">
          {words2.map((word, i) => (
            <span key={i} className={word.trim() ? 'bg-green-200' : ''}>{word}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to format time ago
 */
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return time.toLocaleDateString();
}