"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  XCircle, 
  CheckCheck, 
  ChevronDown, 
  ChevronUp,
  Info,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { IntelligenceEvent, IntelligenceChange } from '@/lib/intelligence/changeDetection';
import type { SubstrateIntelligence } from '@/lib/substrate/types';
import type { ConversationTriggeredGeneration } from '@/lib/intelligence/conversationAnalyzer';
import type { BatchedChange } from '@/lib/intelligence/changeFatiguePrevention';
import { mobileManager, useTouchGestures, type TouchGesture } from '@/lib/intelligence/mobileOptimizations';

interface PageContext {
  page: 'dashboard' | 'document' | 'timeline' | 'detailed-view';
  documentId?: string;
}

interface UniversalChangeModalProps {
  isOpen: boolean;
  changes: IntelligenceEvent | null;
  batchedChanges?: BatchedChange[];
  context: PageContext;
  onApprove: (selectedSections: string[]) => void;
  onReject: (reason?: string) => void;
  onClose: () => void;
  currentIntelligence?: SubstrateIntelligence | null;
  isProcessing?: boolean;
  conversationContext?: ConversationTriggeredGeneration | null;
}

export function UniversalChangeModal({
  isOpen,
  changes,
  batchedChanges = [],
  context,
  onApprove,
  onReject,
  onClose,
  currentIntelligence,
  isProcessing = false,
  conversationContext = null
}: UniversalChangeModalProps) {
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Determine what to display - batched changes or single change
  const displayData = batchedChanges.length > 0 ? batchedChanges[0] : changes;
  const isBatchedView = batchedChanges.length > 0;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile); 
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch gesture handling for mobile swipe-to-approve
  const { handleTouchStart, handleTouchEnd } = useTouchGestures((gesture: TouchGesture) => {
    return mobileManager.handleModalSwipeGestures(
      gesture,
      () => {
        // Swipe right to approve
        const sectionsToApprove = Array.from(selectedSections);
        onApprove(sectionsToApprove);
      },
      () => {
        // Swipe left to reject
        onReject(rejectReason || 'Swiped to reject');
      }
    );
  });

  // Reset state when modal opens/closes or changes update
  useEffect(() => {
    if (isOpen && changes) {
      // Pre-select all sections by default
      const allSections = Object.keys(groupChangesByField(changes.changes));
      setSelectedSections(new Set(allSections));
      setExpandedSections(new Set());
      setShowRejectReason(false);
      setRejectReason('');
    }
  }, [isOpen, changes]);

  if (!isOpen || !changes) return null;

  const changesByField = groupChangesByField(changes.changes);
  const totalChanges = changes.changes.length;
  const selectedCount = selectedSections.size;

  const handleSectionToggle = (section: string) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(section)) {
      newSelected.delete(section);
    } else {
      newSelected.add(section);
    }
    setSelectedSections(newSelected);
  };

  const handleExpandToggle = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSelectAll = () => {
    const allSections = Object.keys(changesByField);
    setSelectedSections(new Set(allSections));
  };

  const handleDeselectAll = () => {
    setSelectedSections(new Set());
  };

  const handleApprove = () => {
    if (selectedSections.size > 0) {
      onApprove(Array.from(selectedSections));
    }
  };

  const handleReject = () => {
    if (showRejectReason && rejectReason.trim()) {
      onReject(rejectReason.trim());
    } else {
      onReject();
    }
  };

  const getOriginBadge = (origin: string) => {
    switch (origin) {
      case 'manual':
        return <Badge variant="default" className="text-xs">Requested</Badge>;
      case 'automatic':
        return <Badge variant="secondary" className="text-xs">Auto-detected</Badge>;
      case 'background':
        return <Badge variant="outline" className="text-xs">Background</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{origin}</Badge>;
    }
  };

  const getContextDescription = () => {
    if (conversationContext) {
      return `Based on your question: "${conversationContext.userQuery}"`;
    }
    
    switch (context.page) {
      case 'dashboard':
        return 'These changes will update your dashboard overview';
      case 'document':
        return 'These changes relate to the current document';
      case 'timeline':
        return 'These changes will update your timeline view';
      default:
        return 'Review and approve intelligence updates';
    }
  };

  const getModalTitle = () => {
    if (conversationContext?.intent.triggerPhrase?.toLowerCase().includes('pattern')) {
      return 'Pattern Analysis Results';
    }
    if (conversationContext?.intent.triggerPhrase?.toLowerCase().includes('recommend')) {
      return 'Strategic Recommendations';
    }
    if (conversationContext?.intent.triggerPhrase?.toLowerCase().includes('summary')) {
      return 'Content Summary';
    }
    return 'Review Intelligence Updates';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 rounded-t-lg">
            <div className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    {getModalTitle()}
                  </h2>
                  <p className="text-sm text-gray-600">{getContextDescription()}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {new Date(changes.timestamp).toLocaleString()}
                  </span>
                </div>
                {conversationContext ? (
                  <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                    Conversation-triggered
                  </Badge>
                ) : (
                  getOriginBadge(changes.origin)
                )}
                <Badge 
                  variant="outline" 
                  className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                >
                  {totalChanges} change{totalChanges !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {/* Selection summary */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-900">
                    {selectedCount === 0 
                      ? 'No sections selected' 
                      : `${selectedCount} of ${Object.keys(changesByField).length} sections selected`
                    }
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-blue-700 hover:text-blue-900 underline"
                  >
                    Select all
                  </button>
                  <span className="text-xs text-blue-400">•</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs text-blue-700 hover:text-blue-900 underline"
                  >
                    Deselect all
                  </button>
                </div>
              </div>
            </div>

            {/* Changes by section */}
            <div className="space-y-3">
              {Object.entries(changesByField).map(([field, fieldChanges]) => (
                <SectionChanges
                  key={field}
                  field={field}
                  changes={fieldChanges}
                  isSelected={selectedSections.has(field)}
                  isExpanded={expandedSections.has(field)}
                  onToggle={() => handleSectionToggle(field)}
                  onExpand={() => handleExpandToggle(field)}
                  currentIntelligence={currentIntelligence}
                  newIntelligence={changes.intelligence}
                />
              ))}
            </div>

            {/* Reject reason input */}
            {showRejectReason && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection (optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide feedback to improve future suggestions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowRejectReason(!showRejectReason)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {showRejectReason ? 'Hide rejection reason' : 'Add rejection reason'}
              </button>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleReject}
                  variant="outline"
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Dismiss All
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={selectedSections.size === 0 || isProcessing}
                  className="min-w-[140px]"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve Selected
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section component for organizing changes by field
function SectionChanges({
  field,
  changes,
  isSelected,
  isExpanded,
  onToggle,
  onExpand,
  currentIntelligence,
  newIntelligence
}: {
  field: string;
  changes: IntelligenceChange[];
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  currentIntelligence?: SubstrateIntelligence | null;
  newIntelligence: SubstrateIntelligence;
}) {
  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'themes': return '🎯';
      case 'insights': return '💡';
      case 'recommendations': return '🚀';
      case 'understanding': return '🧠';
      default: return '📊';
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'themes': return 'Key Themes';
      case 'insights': return 'Insights';
      case 'recommendations': return 'Recommendations';
      case 'understanding': return 'Context Understanding';
      default: return field.charAt(0).toUpperCase() + field.slice(1);
    }
  };

  // Calculate summary stats
  const stats = changes.reduce((acc, change) => {
    acc[change.changeType] = (acc[change.changeType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`border rounded-lg transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
    }`}>
      {/* Section header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                isSelected 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-base">{getFieldIcon(field)}</span>
              <h3 className="font-medium text-gray-900">{getFieldLabel(field)}</h3>
            </div>

            <div className="flex gap-2">
              {stats.added && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  +{stats.added} new
                </Badge>
              )}
              {stats.modified && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  ~{stats.modified} changed
                </Badge>
              )}
              {stats.removed && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  -{stats.removed} removed
                </Badge>
              )}
            </div>
          </div>

          <button
            onClick={onExpand}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-200">
          <div className="pt-3 space-y-2">
            {changes.map((change, index) => (
              <ChangeDetail key={index} change={change} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Individual change detail component
function ChangeDetail({ change }: { change: IntelligenceChange }) {
  const getChangeTypeStyle = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'removed':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'modified':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'reordered':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added': return '+';
      case 'removed': return '-';
      case 'modified': return '~';
      case 'reordered': return '↕';
      default: return '•';
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value?.title) return value.title;
    if (value?.description) return value.description;
    return JSON.stringify(value);
  };

  return (
    <div className={`p-3 rounded-md border ${getChangeTypeStyle(change.changeType)}`}>
      <div className="flex items-start gap-3">
        <span className="font-mono font-bold text-lg flex-shrink-0">
          {getChangeIcon(change.changeType)}
        </span>
        
        <div className="flex-1 space-y-1">
          {/* Change content */}
          {change.changeType === 'added' && (
            <div className="text-sm">{formatValue(change.current)}</div>
          )}
          
          {change.changeType === 'removed' && (
            <div className="text-sm line-through opacity-75">
              {formatValue(change.previous)}
            </div>
          )}
          
          {change.changeType === 'modified' && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-500">Before:</span>
                <div className="mt-1 pl-4 opacity-75 line-through">
                  {formatValue(change.previous)}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-700">After:</span>
                <div className="mt-1 pl-4 font-medium">
                  {formatValue(change.current)}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2">
            <Badge 
              variant={change.significance === 'major' ? 'default' : 'outline'}
              className={`text-xs ${
                change.significance === 'major' 
                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : change.significance === 'moderate'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}
            >
              {change.significance}
            </Badge>
            <span className="text-xs text-gray-500">
              {Math.round(change.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to group changes by field
function groupChangesByField(changes: IntelligenceChange[]): Record<string, IntelligenceChange[]> {
  return changes.reduce((groups, change) => {
    if (!groups[change.field]) {
      groups[change.field] = [];
    }
    groups[change.field].push(change);
    return groups;
  }, {} as Record<string, IntelligenceChange[]>);
}