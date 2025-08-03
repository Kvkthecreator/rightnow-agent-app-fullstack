"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Check, 
  X, 
  Clock, 
  AlertTriangle,
  Brain,
  Settings,
  RefreshCw,
  CheckCheck,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { IntelligenceEvent, IntelligenceChange } from '@/lib/intelligence/changeDetection';
import type { SubstrateIntelligence } from '@/lib/substrate/types';

interface ThinkingPartnerPanelProps {
  basketId: string;
  currentIntelligence: SubstrateIntelligence | null;
  pendingChanges: IntelligenceEvent[];
  onApproveChanges: (eventId: string, sections: string[]) => Promise<void>;
  onRejectChanges: (eventId: string, reason?: string) => Promise<void>;
  onGenerateNew: () => Promise<void>;
  isProcessing: boolean;
  className?: string;
}

type PanelState = 'collapsed' | 'watching' | 'updates-available' | 'review-mode' | 'processing';

export function ThinkingPartnerPanel({
  basketId,
  currentIntelligence,
  pendingChanges,
  onApproveChanges,
  onRejectChanges,
  onGenerateNew,
  isProcessing,
  className = ''
}: ThinkingPartnerPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>('collapsed');
  const [selectedEvent, setSelectedEvent] = useState<IntelligenceEvent | null>(null);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  // Determine panel state based on data
  useEffect(() => {
    if (isProcessing) {
      setPanelState('processing');
    } else if (pendingChanges.length > 0) {
      setPanelState('updates-available');
    } else if (currentIntelligence) {
      setPanelState('watching');
    } else {
      setPanelState('collapsed');
    }
  }, [pendingChanges, currentIntelligence, isProcessing]);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTogglePanel = () => {
    if (isMobile) {
      setShowMobileSheet(!showMobileSheet);
    } else {
      setPanelState(panelState === 'collapsed' ? 'watching' : 'collapsed');
    }
  };

  const handleReviewChanges = (event: IntelligenceEvent) => {
    setSelectedEvent(event);
    setPanelState('review-mode');
    setSelectedSections(new Set());
  };

  const handleBackToUpdates = () => {
    setSelectedEvent(null);
    setPanelState('updates-available');
    setSelectedSections(new Set());
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

  const handleApprove = async () => {
    if (!selectedEvent) return;
    
    try {
      await onApproveChanges(
        selectedEvent.id,
        Array.from(selectedSections)
      );
      handleBackToUpdates();
    } catch (error) {
      console.error('Failed to approve changes:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedEvent) return;
    
    try {
      await onRejectChanges(selectedEvent.id);
      handleBackToUpdates();
    } catch (error) {
      console.error('Failed to reject changes:', error);
    }
  };

  const renderPanelContent = () => {
    switch (panelState) {
      case 'watching':
        return <WatchingState onGenerateNew={onGenerateNew} />;
      
      case 'updates-available':
        return (
          <UpdatesAvailableState 
            pendingChanges={pendingChanges}
            onReviewChanges={handleReviewChanges}
            onGenerateNew={onGenerateNew}
          />
        );
      
      case 'review-mode':
        return selectedEvent ? (
          <ReviewModeState
            event={selectedEvent}
            currentIntelligence={currentIntelligence}
            selectedSections={selectedSections}
            onSectionToggle={handleSectionToggle}
            onApprove={handleApprove}
            onReject={handleReject}
            onBack={handleBackToUpdates}
          />
        ) : null;
      
      case 'processing':
        return <ProcessingState />;
      
      default:
        return null;
    }
  };

  // Mobile bottom sheet
  if (isMobile) {
    return (
      <>
        {/* Mobile FAB */}
        <button
          onClick={handleTogglePanel}
          className={`fixed bottom-6 left-6 z-50 w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-200 ${className}`}
        >
          <Brain className="h-6 w-6 mx-auto" />
          {pendingChanges.length > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {pendingChanges.length}
            </div>
          )}
        </button>

        {/* Mobile bottom sheet */}
        {showMobileSheet && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setShowMobileSheet(false)}>
            <div 
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-xl max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Thinking Partner</h2>
                <button
                  onClick={() => setShowMobileSheet(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                {renderPanelContent()}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop panel
  return (
    <div className={`fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-lg transition-all duration-300 z-30 ${
      panelState === 'collapsed' ? 'w-12' : 'w-80 md:w-96'
    } ${className}`}>
      
      {/* Collapsed state toggle */}
      {panelState === 'collapsed' && (
        <button
          onClick={handleTogglePanel}
          className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-gray-900 border-b border-gray-200"
        >
          <ChevronLeft className="h-5 w-5" />
          {pendingChanges.length > 0 && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></div>
          )}
        </button>
      )}

      {/* Expanded panel content */}
      {panelState !== 'collapsed' && (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Thinking Partner</h2>
            </div>
            <button
              onClick={handleTogglePanel}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {renderPanelContent()}
          </div>
        </div>
      )}
    </div>
  );
}

// Panel state components
function WatchingState({ onGenerateNew }: { onGenerateNew: () => Promise<void> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <div>
          <p className="text-sm font-medium text-green-900">Analysis current</p>
          <p className="text-xs text-green-700">Monitoring for changes</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
        <Button
          onClick={onGenerateNew}
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate fresh analysis
        </Button>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Document changes trigger auto-analysis</p>
          <p>• New insights require your review</p>
          <p>• Manual generation always available</p>
        </div>
      </div>
    </div>
  );
}

function UpdatesAvailableState({ 
  pendingChanges, 
  onReviewChanges, 
  onGenerateNew 
}: { 
  pendingChanges: IntelligenceEvent[];
  onReviewChanges: (event: IntelligenceEvent) => void;
  onGenerateNew: () => Promise<void>;
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <div>
          <p className="text-sm font-medium text-orange-900">
            {pendingChanges.length} update{pendingChanges.length !== 1 ? 's' : ''} pending review
          </p>
          <p className="text-xs text-orange-700">New insights available</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Pending Changes</h3>
        
        {pendingChanges.map((event, index) => (
          <ChangesSummaryCard
            key={event.id}
            event={event}
            index={index}
            onReview={() => onReviewChanges(event)}
          />
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <Button
          onClick={onGenerateNew}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate fresh analysis
        </Button>
      </div>
    </div>
  );
}

function ChangesSummaryCard({ 
  event, 
  index, 
  onReview 
}: { 
  event: IntelligenceEvent;
  index: number;
  onReview: () => void;
}) {
  const changesByField = event.changes.reduce((acc, change) => {
    acc[change.field] = (acc[change.field] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const timeAgo = new Date(event.timestamp).toLocaleDateString();

  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Update #{index + 1}
          </Badge>
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
        <Badge 
          variant={event.origin === 'automatic' ? 'secondary' : 'default'}
          className="text-xs"
        >
          {event.origin}
        </Badge>
      </div>

      <div className="space-y-1 mb-3">
        {Object.entries(changesByField).map(([field, count]) => (
          <div key={field} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 capitalize">{field}</span>
            <span className="font-medium">{count} change{count !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={onReview}
        variant="outline"
        size="sm"
        className="w-full text-xs"
      >
        <Eye className="h-3 w-3 mr-1" />
        Review Changes
      </Button>
    </div>
  );
}

function ReviewModeState({
  event,
  currentIntelligence,
  selectedSections,
  onSectionToggle,
  onApprove,
  onReject,
  onBack
}: {
  event: IntelligenceEvent;
  currentIntelligence: SubstrateIntelligence | null;
  selectedSections: Set<string>;
  onSectionToggle: (section: string) => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onBack: () => void;
}) {
  const changesByField = event.changes.reduce((acc, change) => {
    if (!acc[change.field]) acc[change.field] = [];
    acc[change.field].push(change);
    return acc;
  }, {} as Record<string, IntelligenceChange[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to updates
        </button>
        <h3 className="font-medium text-gray-900">Review Changes</h3>
        <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
      </div>

      {/* Changes content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(changesByField).map(([field, changes]) => (
          <FieldChangesSection
            key={field}
            field={field}
            changes={changes}
            currentIntelligence={currentIntelligence}
            newIntelligence={event.intelligence}
            isSelected={selectedSections.has(field)}
            onToggle={() => onSectionToggle(field)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex gap-2">
          <Button
            onClick={onApprove}
            disabled={selectedSections.size === 0}
            className="flex-1"
            size="sm"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve Selected
          </Button>
          <Button
            onClick={onReject}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <X className="h-4 w-4 mr-1" />
            Dismiss All
          </Button>
        </div>
        
        <Button
          onClick={() => {
            // Select all sections
            const allSections = Object.keys(changesByField);
            allSections.forEach(section => {
              if (!selectedSections.has(section)) {
                onSectionToggle(section);
              }
            });
          }}
          variant="ghost"
          size="sm"
          className="w-full text-xs"
        >
          <CheckCheck className="h-3 w-3 mr-1" />
          Select All
        </Button>
      </div>
    </div>
  );
}

function FieldChangesSection({
  field,
  changes,
  currentIntelligence,
  newIntelligence,
  isSelected,
  onToggle
}: {
  field: string;
  changes: IntelligenceChange[];
  currentIntelligence: SubstrateIntelligence | null;
  newIntelligence: SubstrateIntelligence;
  isSelected: boolean;
  onToggle: () => void;
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

  return (
    <div className={`border rounded-lg p-3 transition-colors ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getFieldIcon(field)}</span>
          <h4 className="text-sm font-medium text-gray-900 capitalize">{field}</h4>
          <Badge variant="outline" className="text-xs">
            {changes.length} change{changes.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected 
              ? 'border-blue-500 bg-blue-500 text-white' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>
      </div>

      <div className="space-y-2">
        {changes.map((change, index) => (
          <ChangeItem key={index} change={change} />
        ))}
      </div>
    </div>
  );
}

function ChangeItem({ change }: { change: IntelligenceChange }) {
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added': return 'text-green-700 bg-green-50 border-green-200';
      case 'removed': return 'text-red-700 bg-red-50 border-red-200';
      case 'modified': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'reordered': return 'text-purple-700 bg-purple-50 border-purple-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
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

  return (
    <div className={`text-xs p-2 rounded border ${getChangeColor(change.changeType)}`}>
      <div className="flex items-start gap-2">
        <span className="font-mono font-bold">
          {getChangeIcon(change.changeType)}
        </span>
        <div className="flex-1">
          <div className="font-medium capitalize mb-1">
            {change.changeType} {change.field}
          </div>
          {change.changeType === 'added' && (
            <div className="text-gray-700">
              {typeof change.current === 'string' 
                ? change.current 
                : change.current?.title || JSON.stringify(change.current)
              }
            </div>
          )}
          {change.changeType === 'removed' && (
            <div className="text-gray-700 line-through">
              {typeof change.previous === 'string' 
                ? change.previous 
                : change.previous?.title || JSON.stringify(change.previous)
              }
            </div>
          )}
          {change.changeType === 'modified' && (
            <div className="space-y-1">
              <div className="text-gray-600 line-through">
                {typeof change.previous === 'string' 
                  ? change.previous 
                  : change.previous?.title || 'Previous value'
                }
              </div>
              <div className="text-gray-700">
                {typeof change.current === 'string' 
                  ? change.current 
                  : change.current?.title || 'New value'
                }
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant={change.significance === 'major' ? 'default' : 
                     change.significance === 'moderate' ? 'default' : 'secondary'}
              className={`text-xs ${
                change.significance === 'major' ? 'bg-red-100 text-red-800 border-red-200' :
                change.significance === 'moderate' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {change.significance}
            </Badge>
            <span className="text-gray-500">
              {Math.round(change.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingState() {
  return (
    <div className="p-4 flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">Generating insights</p>
        <p className="text-xs text-gray-500">Analyzing your content changes</p>
      </div>
    </div>
  );
}