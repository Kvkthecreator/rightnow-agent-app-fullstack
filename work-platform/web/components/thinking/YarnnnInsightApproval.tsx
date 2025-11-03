"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  XCircle, 
  Sparkles, 
  Eye,
  Heart,
  Brain,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { IntelligenceEvent } from '@/lib/intelligence/changeDetection';
import type { SubstrateIntelligence } from '@/lib/substrate/types';
import type { ConversationTriggeredGeneration } from '@/lib/intelligence/conversationAnalyzer';
import type { 
  PendingChange, 
  UseUniversalChangesReturn 
} from '@/lib/hooks/useUniversalChanges';

interface PageContext {
  page: 'dashboard' | 'document' | 'timeline' | 'detailed-view';
  documentId?: string;
}

interface YarnnnInsightApprovalProps {
  isOpen: boolean;
  
  // Legacy intelligence support (for transition)
  legacyChanges?: IntelligenceEvent | null;
  
  // New universal changes
  pendingChanges?: PendingChange[];
  
  // Universal change management
  changeManager?: UseUniversalChangesReturn;
  
  context: PageContext;
  onClose: () => void;
  currentIntelligence?: SubstrateIntelligence | null;
  isProcessing?: boolean;
  conversationContext?: ConversationTriggeredGeneration | null;
}

interface InsightItem {
  id: string;
  type: 'understanding' | 'theme' | 'connection' | 'recommendation';
  title: string;
  description: string;
  impact: string;
  beforeState?: string;
  afterState: string;
  isSelected: boolean;
}

export function YarnnnInsightApproval({
  isOpen,
  legacyChanges,
  pendingChanges = [],
  changeManager,
  context,
  onClose,
  currentIntelligence,
  isProcessing = false,
  conversationContext = null
}: YarnnnInsightApprovalProps) {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Transform technical changes into human insights
  useEffect(() => {
    if (!isOpen) return;

    const transformedInsights: InsightItem[] = [];

    // Handle legacy intelligence changes
    if (legacyChanges?.changes) {
      const changesByField = groupChangesByField(legacyChanges.changes);
      
      Object.entries(changesByField).forEach(([field, changes]) => {
        changes.forEach((change, index) => {
          const insight = transformChangeToInsight(field, change, `${field}-${index}`);
          if (insight) {
            transformedInsights.push(insight);
          }
        });
      });
    }

    // Handle universal changes
    pendingChanges.forEach((change) => {
      const insight = transformUniversalChangeToInsight(change);
      if (insight) {
        transformedInsights.push(insight);
      }
    });

    // Select all insights by default
    const insightsWithSelection = transformedInsights.map(insight => ({
      ...insight,
      isSelected: true
    }));

    setInsights(insightsWithSelection);
  }, [isOpen, legacyChanges, pendingChanges]);

  const transformChangeToInsight = (field: string, change: any, id: string): InsightItem | null => {
    const getFieldIcon = (field: string) => {
      switch (field) {
        case 'themes': return '🎯';
        case 'insights': return '💡';
        case 'recommendations': return '🚀';
        case 'understanding': return '🧠';
        default: return '✨';
      }
    };

    const getFieldTitle = (field: string) => {
      switch (field) {
        case 'themes': return 'Key Theme';
        case 'insights': return 'New Insight';
        case 'recommendations': return 'Recommendation';
        case 'understanding': return 'Understanding';
        default: return 'Discovery';
      }
    };

    const getHumanDescription = (change: any) => {
      if (change.changeType === 'added') {
        const content = change.current?.title || change.current?.description || change.current;
        if (typeof content === 'string') {
          return content;
        }
        return 'New understanding discovered';
      } else if (change.changeType === 'modified') {
        const newContent = change.current?.title || change.current?.description || change.current;
        if (typeof newContent === 'string') {
          return newContent;
        }
        return 'Understanding refined';
      }
      return 'Insight discovered';
    };

    const getImpact = (field: string, changeType: string) => {
      switch (field) {
        case 'themes':
          return changeType === 'added' 
            ? 'This theme will help organize your thinking' 
            : 'This theme will be updated with new insights';
        case 'insights':
          return 'This insight will deepen your understanding';
        case 'recommendations':
          return 'This recommendation will guide your next steps';
        case 'understanding':
          return 'This will enhance how I understand your work';
        default:
          return 'This will enrich your research substrate';
      }
    };

    return {
      id,
      type: field === 'themes' ? 'theme' : 
            field === 'recommendations' ? 'recommendation' : 
            field === 'understanding' ? 'understanding' : 'connection',
      title: `${getFieldIcon(field)} ${getFieldTitle(field)}`,
      description: getHumanDescription(change),
      impact: getImpact(field, change.changeType),
      beforeState: change.changeType === 'modified' 
        ? (change.previous?.title || change.previous?.description || change.previous)
        : undefined,
      afterState: change.current?.title || change.current?.description || change.current || 'New understanding',
      isSelected: true
    };
  };

  const transformUniversalChangeToInsight = (change: PendingChange): InsightItem | null => {
    const getChangeDescription = () => {
      switch (change.type) {
        case 'basket_update':
          return 'I discovered a better way to understand your research focus';
        case 'document_create':
          return 'I want to create a new document to capture your insights';
        case 'document_update':
          return 'I found ways to enhance your document with new connections';
        case 'context_add':
          return 'I identified important context to remember about your work';
        default:
          return 'I discovered something important about your research';
      }
    };

    const getImpact = () => {
      switch (change.type) {
        case 'basket_update':
          return 'This will help me better understand what you\'re working toward';
        case 'document_create':
          return 'This will organize your thoughts into a structured document';
        case 'document_update':
          return 'This will enrich your document with new insights and connections';
        case 'context_add':
          return 'This will help me remember important context for future conversations';
        default:
          return 'This will enhance your research substrate';
      }
    };

    return {
      id: change.id,
      type: change.type === 'basket_update' ? 'understanding' : 
            change.type.includes('document') ? 'connection' : 'theme',
      title: `✨ ${change.type === 'basket_update' ? 'Research Understanding' : 
                  change.type.includes('document') ? 'Document Insight' : 'Context Discovery'}`,
      description: getChangeDescription(),
      impact: getImpact(),
      afterState: JSON.stringify(change.data, null, 2),
      isSelected: true
    };
  };

  const handleInsightToggle = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, isSelected: !insight.isSelected }
        : insight
    ));
  };

  const handleSelectAll = () => {
    setInsights(prev => prev.map(insight => ({ ...insight, isSelected: true })));
  };

  const handleDeselectAll = () => {
    setInsights(prev => prev.map(insight => ({ ...insight, isSelected: false })));
  };

  const handleApprove = async () => {
    const selectedInsights = insights.filter(insight => insight.isSelected);
    if (selectedInsights.length === 0) return;

    try {
      if (changeManager && pendingChanges.length > 0) {
        // Universal Changes approval
        const selectedChangeIds = selectedInsights
          .filter(insight => pendingChanges.some(change => change.id === insight.id))
          .map(insight => insight.id);
        
        if (selectedChangeIds.length > 0) {
          await changeManager.approveChanges(selectedChangeIds);
        }
      }
      
      if (legacyChanges) {
        // Legacy approval - would need the original onApprove handler
        // For now, we'll close the modal
      }

      onClose();
    } catch (error) {
      console.error('Failed to approve insights:', error);
    }
  };

  const handleReject = async () => {
    try {
      if (changeManager && pendingChanges.length > 0) {
        const selectedChangeIds = insights
          .filter(insight => !insight.isSelected)
          .map(insight => insight.id);
        
        if (selectedChangeIds.length > 0) {
          await changeManager.rejectChanges(selectedChangeIds, rejectReason);
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to reject insights:', error);
    }
  };

  const getModalTitle = () => {
    const triggerPhrase = conversationContext?.intent?.triggerPhrase;
    if (typeof triggerPhrase === 'string') {
      const phrase = triggerPhrase.toLowerCase();
      if (phrase.includes('pattern')) {
        return 'I found patterns in your research';
      }
      if (phrase.includes('recommend')) {
        return 'I have recommendations for you';
      }
      if (phrase.includes('summary')) {
        return 'I created a summary of your work';
      }
    }
    return 'I discovered insights about your research';
  };

  const getModalDescription = () => {
    if (conversationContext) {
      return `Based on your question: "${conversationContext.userQuery}"`;
    }
    
    switch (context.page) {
      case 'dashboard':
        return 'From observing your research patterns and connections';
      case 'document':
        return 'While you were working on this document';
      case 'timeline':
        return 'From your research journey over time';
      default:
        return 'These insights will help you stay in touch with what you\'re becoming';
    }
  };

  if (!isOpen || insights.length === 0) {
    return null;
  }

  const selectedCount = insights.filter(insight => insight.isSelected).length;
  const totalCount = insights.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100">
          
          {/* Header - Human, Warm */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {getModalTitle()}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {getModalDescription()}
                    </p>
                  </div>
                </div>
                
                {conversationContext && (
                  <div className="flex items-center gap-2 ml-13">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Conversation insight
                    </span>
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
          </div>

          {/* Selection Summary */}
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  {selectedCount === 0 
                    ? 'No insights selected' 
                    : selectedCount === totalCount
                    ? `All ${totalCount} insights selected`
                    : `${selectedCount} of ${totalCount} insights selected`
                  }
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => selectedCount === totalCount ? handleDeselectAll() : handleSelectAll()}
                  className="text-xs text-purple-700 hover:text-purple-900 underline"
                >
                  {selectedCount === totalCount ? 'Deselect all' : 'Select all'}
                </button>
              </div>
            </div>
          </div>

          {/* Insights List */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
            {insights.map((insight) => (
              <div 
                key={insight.id}
                className={`border rounded-xl p-4 transition-all duration-200 ${
                  insight.isSelected
                    ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Selection */}
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      checked={insight.isSelected}
                      onChange={() => handleInsightToggle(insight.id)}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 text-base">
                        {insight.title}
                      </h4>
                      <p className="text-gray-700 mt-1 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>

                    {/* Impact */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-blue-700">Impact:</span> {insight.impact}
                        </p>
                      </div>
                    </div>

                    {/* Before/After (if applicable) */}
                    {insight.beforeState && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setExpandedInsight(
                            expandedInsight === insight.id ? null : insight.id
                          )}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                          <Eye className="h-3 w-3" />
                          {expandedInsight === insight.id ? 'Hide details' : 'See what will change'}
                        </button>
                        
                        {expandedInsight === insight.id && (
                          <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">Before:</div>
                              <div className="text-sm text-gray-600 bg-red-50 p-2 rounded">
                                {insight.beforeState}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">After:</div>
                              <div className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                                {insight.afterState}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reject reason input */}
          {showRejectReason && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Help me understand what didn't resonate (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Your feedback helps me learn your preferences..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
                rows={3}
              />
            </div>
          )}

          {/* Actions - Warm, Human */}
          <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowRejectReason(!showRejectReason)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {showRejectReason ? 'Hide feedback' : 'Not quite right?'}
              </button>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleReject}
                  variant="outline"
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Not now
                </Button>
                
                <Button
                  onClick={handleApprove}
                  disabled={selectedCount === 0 || isProcessing}
                  className={`min-w-[140px] flex items-center gap-2 ${
                    selectedCount > 0 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                      : ''
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding to memory...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Yes, add to my understanding ({selectedCount})
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

// Helper function to group changes by field (for legacy support)
function groupChangesByField(changes: any[]): Record<string, any[]> {
  return changes.reduce((groups, change) => {
    if (!groups[change.field]) {
      groups[change.field] = [];
    }
    groups[change.field].push(change);
    return groups;
  }, {} as Record<string, any[]>);
}