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
  AlertTriangle,
  FileText,
  Folder,
  MessageSquare,
  Blocks
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { IntelligenceEvent, IntelligenceChange } from '@/lib/intelligence/changeDetection';
import type { SubstrateIntelligence } from '@/lib/substrate/types';
import type { ConversationTriggeredGeneration } from '@/lib/intelligence/conversationAnalyzer';
import type { BatchedChange } from '@/lib/intelligence/changeFatiguePrevention';
import type { 
  PendingChange, 
  UseUniversalChangesReturn 
} from '@/lib/hooks/useUniversalChanges';
import type { ChangeType, Conflict } from '@/lib/services/UniversalChangeService';
import { mobileManager, useTouchGestures, type TouchGesture } from '@/lib/intelligence/mobileOptimizations';

interface PageContext {
  page: 'dashboard' | 'document' | 'timeline' | 'detailed-view';
  documentId?: string;
}

// Enhanced props to support all change types
interface UniversalChangeModalProps {
  isOpen: boolean;
  
  // Legacy intelligence support (for backward compatibility)
  changes?: IntelligenceEvent | null;
  batchedChanges?: BatchedChange[];
  
  // New universal changes support
  pendingChanges?: PendingChange[];
  conflicts?: Conflict[];
  
  // Universal change management
  changeManager?: UseUniversalChangesReturn;
  
  context: PageContext;
  onApprove?: (selectedSections: string[]) => void;
  onReject?: (reason?: string) => void;
  onClose: () => void;
  currentIntelligence?: SubstrateIntelligence | null;
  isProcessing?: boolean;
  conversationContext?: ConversationTriggeredGeneration | null;
}

export function UniversalChangeModal({
  isOpen,
  changes,
  batchedChanges = [],
  pendingChanges = [],
  conflicts = [],
  changeManager,
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

  // Enhanced modal state for all change types
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'changes' | 'conflicts'>('changes');

  // Determine what to display - universal changes take precedence
  const hasUniversalChanges = pendingChanges.length > 0;
  const hasConflicts = conflicts.length > 0;
  const hasLegacyChanges = changes !== null && changes !== undefined;
  
  // Legacy support - batched changes or single change
  const displayData = batchedChanges.length > 0 ? batchedChanges[0] : changes;
  const isBatchedView = batchedChanges.length > 0;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile); 
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced touch gesture handling for all change types
  const { handleTouchStart, handleTouchEnd } = useTouchGestures((gesture: TouchGesture) => {
    return mobileManager.handleModalSwipeGestures(
      gesture,
      () => {
        // Swipe right to approve
        if (hasUniversalChanges && changeManager) {
          handleUniversalApprove();
        } else if (onApprove) {
          const sectionsToApprove = Array.from(selectedSections);
          onApprove(sectionsToApprove);
        }
      },
      () => {
        // Swipe left to reject
        if (hasUniversalChanges && changeManager) {
          handleUniversalReject();
        } else if (onReject) {
          onReject(rejectReason || 'Swiped to reject');
        }
      }
    );
  });

  // Universal change handlers
  const handleUniversalApprove = async () => {
    if (!changeManager) return;
    
    const changesToApprove = Array.from(selectedChanges);
    if (changesToApprove.length === 0) return;
    
    try {
      await changeManager.approveChanges(changesToApprove);
      onClose();
    } catch (error) {
      console.error('Failed to approve changes:', error);
    }
  };

  const handleUniversalReject = async () => {
    if (!changeManager) return;
    
    const changesToReject = Array.from(selectedChanges);
    if (changesToReject.length === 0) return;
    
    try {
      await changeManager.rejectChanges(changesToReject, rejectReason);
      onClose();
    } catch (error) {
      console.error('Failed to reject changes:', error);
    }
  };

  const handleConflictResolve = async (conflictId: string, resolution: string) => {
    if (!changeManager) return;
    
    try {
      await changeManager.resolveConflict(conflictId, resolution as any);
      setConflictResolutions(prev => ({ ...prev, [conflictId]: resolution }));
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  // Enhanced state reset for all change types
  useEffect(() => {
    if (isOpen) {
      // Reset universal changes state
      if (hasUniversalChanges) {
        const allChangeIds = pendingChanges.map(change => change.id);
        setSelectedChanges(new Set(allChangeIds));
        setActiveTab(hasConflicts ? 'conflicts' : 'changes');
      }
      
      // Reset legacy changes state
      if (hasLegacyChanges && changes) {
        const allSections = Object.keys(groupChangesByField(changes.changes));
        setSelectedSections(new Set(allSections));
      }
      
      // Reset common state
      setExpandedSections(new Set());
      setShowRejectReason(false);
      setRejectReason('');
      setConflictResolutions({});
    }
  }, [isOpen, hasUniversalChanges, hasLegacyChanges, pendingChanges, changes, hasConflicts]);

  // Enhanced visibility condition - show if any changes exist
  if (!isOpen || (!hasUniversalChanges && !hasLegacyChanges && !hasConflicts)) {
    return null;
  }

  // Legacy changes logic (when using old intelligence system)
  const legacyChangesByField = hasLegacyChanges && changes ? groupChangesByField(changes.changes) : {};
  const legacyTotalChanges = hasLegacyChanges && changes ? changes.changes.length : 0;
  const legacySelectedCount = selectedSections.size;

  // Universal changes logic
  const universalTotalChanges = pendingChanges.length;
  const universalSelectedCount = selectedChanges.size;

  // Helper functions for universal changes
  const getChangeIcon = (type: ChangeType) => {
    switch (type) {
      case 'basket_update': return <Folder className="h-4 w-4" />;
      case 'document_create':
      case 'document_update': return <FileText className="h-4 w-4" />;
      case 'intelligence_approve':
      case 'intelligence_reject': return <Sparkles className="h-4 w-4" />;
      case 'context_add': return <MessageSquare className="h-4 w-4" />;
      case 'block_create':
      case 'block_update': return <Blocks className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getChangeTypeLabel = (type: ChangeType) => {
    switch (type) {
      case 'basket_update': return 'Basket Update';
      case 'document_create': return 'Document Creation';
      case 'document_update': return 'Document Update';
      case 'document_delete': return 'Document Deletion';
      case 'intelligence_approve': return 'Intelligence Approval';
      case 'intelligence_reject': return 'Intelligence Rejection';
      case 'context_add': return 'Context Addition';
      case 'block_create': return 'Block Creation';
      case 'block_update': return 'Block Update';
      case 'block_delete': return 'Block Deletion';
      default: return 'Unknown Change';
    }
  };

  const getChangeDescription = (change: PendingChange) => {
    switch (change.type) {
      case 'basket_update':
        const basketData = change.data as any;
        return `Update basket: ${basketData.name ? `name to "${basketData.name}"` : 'properties'}`;
      case 'document_create':
        const docCreateData = change.data as any;
        return `Create document: "${docCreateData.title || 'Untitled'}"`;
      case 'document_update':
        const docUpdateData = change.data as any;
        return `Update document content and properties`;
      case 'context_add':
        const contextData = change.data as any;
        return `Add ${contextData.content?.length || 1} context item(s)`;
      default:
        return 'Process change request';
    }
  };

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
    const allSections = Object.keys(legacyChangesByField);
    setSelectedSections(new Set(allSections));
  };

  const handleDeselectAll = () => {
    setSelectedSections(new Set());
  };

  const handleApprove = () => {
    if (selectedSections.size > 0 && onApprove) {
      onApprove(Array.from(selectedSections));
    }
  };

  const handleReject = () => {
    if (!onReject) return;
    
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
          {/* Enhanced Header with Tabs */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 rounded-t-lg">
            <div className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      {hasUniversalChanges ? (
                        <Info className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-purple-600" />
                      )}
                      {hasUniversalChanges ? 'Change Management' : getModalTitle()}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {hasUniversalChanges 
                        ? `Review and approve ${universalTotalChanges} pending change${universalTotalChanges !== 1 ? 's' : ''}`
                        : getContextDescription()
                      }
                    </p>
                  </div>
                  
                  {/* Tab Navigation for Universal Changes */}
                  {(hasUniversalChanges || hasConflicts) && (
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                      {hasUniversalChanges && (
                        <button
                          onClick={() => setActiveTab('changes')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            activeTab === 'changes'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Changes ({universalTotalChanges})
                        </button>
                      )}
                      {hasConflicts && (
                        <button
                          onClick={() => setActiveTab('conflicts')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                            activeTab === 'conflicts'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Conflicts ({conflicts.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Show timestamp and badges for legacy changes */}
              {hasLegacyChanges && changes && (
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
                    {legacyTotalChanges} change{legacyTotalChanges !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}

              {/* Show status for universal changes */}
              {hasUniversalChanges && (
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Real-time updates
                    </span>
                  </div>
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-300">
                    Universal System
                  </Badge>
                  {changeManager?.isProcessing && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      Processing {changeManager.processingCount} change{changeManager.processingCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Content for All Change Types */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            
            {/* Universal Changes Content */}
            {hasUniversalChanges && activeTab === 'changes' && (
              <>
                {/* Selection Summary for Universal Changes */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCheck className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {universalSelectedCount} of {universalTotalChanges} change{universalTotalChanges !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedChanges(new Set())}
                        className="text-xs h-7"
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedChanges(new Set(pendingChanges.map(c => c.id)))}
                        className="text-xs h-7"
                      >
                        Select All
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Universal Changes List */}
                <div className="space-y-3">
                  {pendingChanges.map((change) => (
                    <div 
                      key={change.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        selectedChanges.has(change.id)
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Selection Checkbox */}
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            checked={selectedChanges.has(change.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedChanges);
                              if (e.target.checked) {
                                newSelected.add(change.id);
                              } else {
                                newSelected.delete(change.id);
                              }
                              setSelectedChanges(newSelected);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>

                        {/* Change Icon and Content */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getChangeIcon(change.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">
                                  {getChangeTypeLabel(change.type)}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    change.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                    change.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                    change.status === 'processing' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {change.status}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                {getChangeDescription(change)}
                              </p>

                              {/* Change Details */}
                              <div className="text-xs text-gray-500 space-y-1">
                                <div className="flex items-center gap-4">
                                  <span>
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {new Date(change.timestamp).toLocaleString()}
                                  </span>
                                  <span>
                                    ID: {change.id.slice(-8)}
                                  </span>
                                </div>
                                
                                {/* Show errors if any */}
                                {change.errors && change.errors.length > 0 && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                                    <div className="flex items-center gap-1 mb-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span className="font-medium">Errors:</span>
                                    </div>
                                    <ul className="text-xs space-y-1">
                                      {change.errors.map((error, idx) => (
                                        <li key={idx}>• {error}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Show warnings if any */}
                                {change.warnings && change.warnings.length > 0 && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                                    <div className="flex items-center gap-1 mb-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span className="font-medium">Warnings:</span>
                                    </div>
                                    <ul className="text-xs space-y-1">
                                      {change.warnings.map((warning, idx) => (
                                        <li key={idx}>• {warning}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Conflicts Content */}
            {hasConflicts && activeTab === 'conflicts' && (
              <>
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">
                      {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} resolution
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {conflicts.map((conflict) => (
                    <div key={conflict.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-red-900 mb-1">
                            {conflict.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-red-700">{conflict.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-700 mb-1">Current Value:</div>
                            <pre className="text-gray-600 whitespace-pre-wrap">
                              {JSON.stringify(conflict.currentValue, null, 2)}
                            </pre>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-700 mb-1">Incoming Value:</div>
                            <pre className="text-gray-600 whitespace-pre-wrap">
                              {JSON.stringify(conflict.incomingValue, null, 2)}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-2 text-sm">Resolution Options:</div>
                          <div className="space-y-2">
                            {conflict.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleConflictResolve(conflict.id, suggestion.strategy)}
                                disabled={conflictResolutions[conflict.id] === suggestion.strategy}
                                className={`w-full text-left p-2 rounded border transition-colors text-sm ${
                                  conflictResolutions[conflict.id] === suggestion.strategy
                                    ? 'bg-green-100 border-green-300 text-green-800'
                                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                              >
                                <div className="font-medium mb-1">{suggestion.strategy.replace(/_/g, ' ')}</div>
                                <div className="text-xs text-gray-600">{suggestion.description}</div>
                                {conflictResolutions[conflict.id] === suggestion.strategy && (
                                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Applied
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Legacy Intelligence Changes Content */}
            {hasLegacyChanges && !hasUniversalChanges && (
              <>
                {/* Selection summary */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-900">
                    {legacySelectedCount === 0 
                      ? 'No sections selected' 
                      : `${legacySelectedCount} of ${Object.keys(legacyChangesByField).length} sections selected`
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
              {Object.entries(legacyChangesByField).map(([field, fieldChanges]) => (
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
                
                {/* Reject reason input for legacy changes */}
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
              </>
            )}

            {/* Reject reason input for universal changes */}
            {hasUniversalChanges && showRejectReason && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection (optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide feedback to improve future changes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Enhanced Actions for All Change Types */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowRejectReason(!showRejectReason)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {showRejectReason ? 'Hide rejection reason' : 'Add rejection reason'}
              </button>
              
              <div className="flex gap-3">
                {/* Universal Changes Actions */}
                {hasUniversalChanges && (
                  <>
                    <Button
                      onClick={handleUniversalReject}
                      variant="outline"
                      disabled={changeManager?.isProcessing || universalSelectedCount === 0}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Selected ({universalSelectedCount})
                    </Button>
                    <Button
                      onClick={handleUniversalApprove}
                      disabled={changeManager?.isProcessing || universalSelectedCount === 0}
                      className="min-w-[140px]"
                    >
                      {changeManager?.isProcessing ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Approve Selected ({universalSelectedCount})
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Legacy Intelligence Actions */}
                {hasLegacyChanges && !hasUniversalChanges && (
                  <>
                    <Button
                      onClick={() => onReject?.(rejectReason || 'Dismissed')}
                      variant="outline"
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Dismiss All
                    </Button>
                    <Button
                      onClick={() => onApprove?.(Array.from(selectedSections))}
                      disabled={legacySelectedCount === 0 || isProcessing}
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
                          Approve Selected ({legacySelectedCount})
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Conflicts Only Actions */}
                {hasConflicts && !hasUniversalChanges && !hasLegacyChanges && (
                  <Button
                    onClick={onClose}
                    className="min-w-[140px]"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                )}
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