/**
 * Document Impact Checkpoint UI
 * 
 * Dedicated interface for managing document updates after substrate changes.
 * Maintains canon purity - completely separate from substrate governance.
 */

"use client";

import { useState, useEffect } from 'react';
import { X, FileText, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, Eye, Settings, BookOpen, Zap, Pause, Skip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { createBrowserClient } from '@/lib/supabase/clients';
import { getConfidenceColor, getImpactTypeIcon } from '@/lib/artifacts/documentImpactPreview';

export interface DocumentImpact {
  id: string;
  document_id: string;
  document_title: string;
  substrate_commit_id: string;
  impact_type: 'content_drift' | 'new_references' | 'reference_removed' | 'structural_change';
  affected_references: Array<{
    id: string;
    type: 'dump' | 'block' | 'context_item' | 'timeline_event';
    title: string;
    relationship_to_document: string;
  }>;
  proposed_action_type: 'recompose' | 'add_references' | 'update_references' | 'version_snapshot';
  proposed_action_details: {
    action_type: string;
    description: string;
    estimated_impact: 'minor' | 'moderate' | 'major';
  };
  confidence_score: number;
  impact_summary: string;
  status: 'pending' | 'auto_applied' | 'user_approved' | 'user_deferred' | 'user_skipped' | 'resolved';
  batch_id?: string;
  batch_name?: string;
  created_at: string;
}

export interface DocumentImpactCheckpointProps {
  workspaceId: string;
  basketId?: string;
  onClose: () => void;
  onImpactProcessed?: () => void;
}

export function DocumentImpactCheckpoint({ 
  workspaceId, 
  basketId,
  onClose, 
  onImpactProcessed 
}: DocumentImpactCheckpointProps) {
  const [impacts, setImpacts] = useState<DocumentImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingImpactId, setProcessingImpactId] = useState<string | null>(null);
  const [selectedImpactId, setSelectedImpactId] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedImpacts, setSelectedImpacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingImpacts();
  }, [workspaceId, basketId]);

  const fetchPendingImpacts = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserClient();
      
      let query = supabase
        .from('document_impact_summary')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('status', ['pending', 'user_deferred'])
        .order('created_at', { ascending: false });

      // Filter by basket if provided
      if (basketId) {
        // This would need a join or filter - for now get all workspace impacts
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch document impacts: ${fetchError.message}`);
      }

      setImpacts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document impacts');
    } finally {
      setLoading(false);
    }
  };

  const handleImpactAction = async (
    impactId: string, 
    action: 'approve' | 'defer' | 'skip' | 'auto_apply',
    notes?: string
  ) => {
    try {
      setProcessingImpactId(impactId);
      
      const response = await fetch(`/api/artifacts/document-impacts/${impactId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: notes || '',
          workspace_id: workspaceId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to process impact: ${response.statusText}`);
      }

      // Refresh impacts
      await fetchPendingImpacts();
      
      if (onImpactProcessed) {
        onImpactProcessed();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process impact');
    } finally {
      setProcessingImpactId(null);
    }
  };

  const handleBatchAction = async (action: 'approve_all' | 'skip_all' | 'defer_all') => {
    if (selectedImpacts.size === 0) return;

    try {
      setProcessingImpactId('batch');
      
      const response = await fetch('/api/artifacts/document-impacts/batch-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impact_ids: Array.from(selectedImpacts),
          action,
          workspace_id: workspaceId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to process batch: ${response.statusText}`);
      }

      // Clear selection and refresh
      setSelectedImpacts(new Set());
      await fetchPendingImpacts();
      
      if (onImpactProcessed) {
        onImpactProcessed();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process batch');
    } finally {
      setProcessingImpactId(null);
    }
  };

  const toggleImpactSelection = (impactId: string) => {
    const newSelection = new Set(selectedImpacts);
    if (newSelection.has(impactId)) {
      newSelection.delete(impactId);
    } else {
      newSelection.add(impactId);
    }
    setSelectedImpacts(newSelection);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'recompose': return <FileText className="h-4 w-4" />;
      case 'add_references': return <ChevronRight className="h-4 w-4" />;
      case 'update_references': return <Settings className="h-4 w-4" />;
      case 'version_snapshot': return <Clock className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getImpactSeverityColor = (impact: DocumentImpact) => {
    if (impact.proposed_action_details.estimated_impact === 'major') return 'border-red-200 bg-red-50/30';
    if (impact.proposed_action_details.estimated_impact === 'moderate') return 'border-yellow-200 bg-yellow-50/30';
    return 'border-blue-200 bg-blue-50/30';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
              <span className="ml-3 text-gray-600">Loading document impacts...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Document Update Checkpoints
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Review and approve document updates after substrate changes
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Controls */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {impacts.length} pending impact{impacts.length === 1 ? '' : 's'}
                </Badge>
                {impacts.length > 1 && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={batchMode}
                      onChange={(e) => setBatchMode(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Batch mode
                  </label>
                )}
              </div>
              
              {batchMode && selectedImpacts.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedImpacts.size} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleBatchAction('approve_all')}
                    disabled={processingImpactId === 'batch'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Apply All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchAction('defer_all')}
                    disabled={processingImpactId === 'batch'}
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Defer All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchAction('skip_all')}
                    disabled={processingImpactId === 'batch'}
                  >
                    <Skip className="h-3 w-3 mr-1" />
                    Skip All
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
                <Button 
                  size="sm" 
                  onClick={() => setError(null)} 
                  className="mt-2"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {impacts.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Document Updates</h3>
                <p className="text-gray-600">All documents are up to date with recent substrate changes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {impacts.map((impact) => {
                  const confidenceColor = getConfidenceColor(
                    impact.confidence_score > 0.8 ? 'high' : 
                    impact.confidence_score > 0.6 ? 'medium' : 'low'
                  );
                  const impactIcon = getImpactTypeIcon(impact.impact_type);
                  const actionIcon = getActionIcon(impact.proposed_action_type);
                  const isProcessing = processingImpactId === impact.id;
                  const isSelected = selectedImpacts.has(impact.id);

                  return (
                    <Card key={impact.id} className={`${getImpactSeverityColor(impact)} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3 flex-1">
                            {batchMode && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleImpactSelection(impact.id)}
                                className="mt-1 rounded border-gray-300"
                              />
                            )}
                            <span className="text-2xl">{impactIcon}</span>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {impact.document_title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {impact.impact_summary}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline">
                                  {impact.affected_references.length} references
                                </Badge>
                                <Badge className={confidenceColor}>
                                  {Math.round(impact.confidence_score * 100)}% confidence
                                </Badge>
                                {impact.batch_name && (
                                  <Badge variant="outline">
                                    {impact.batch_name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Proposed Action */}
                        <div className="mb-4 p-3 bg-white border border-gray-200 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            {actionIcon}
                            <span className="font-medium text-sm text-gray-900">
                              Proposed Action: {impact.proposed_action_details.description}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Impact level: <strong>{impact.proposed_action_details.estimated_impact}</strong>
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedImpactId(
                              selectedImpactId === impact.id ? null : impact.id
                            )}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {selectedImpactId === impact.id ? 'Hide' : 'View'} Details
                          </Button>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleImpactAction(impact.id, 'skip')}
                              disabled={isProcessing}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Skip
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleImpactAction(impact.id, 'defer')}
                              disabled={isProcessing}
                              className="text-yellow-600 hover:text-yellow-800"
                            >
                              <Pause className="h-3 w-3 mr-1" />
                              Defer
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleImpactAction(impact.id, 'approve')}
                              disabled={isProcessing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isProcessing ? (
                                <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-1" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Apply Update
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {selectedImpactId === impact.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-sm text-gray-900 mb-2">Affected References:</h4>
                            <div className="space-y-2">
                              {impact.affected_references.map((ref, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
                                  <Badge variant="outline" className="text-xs">
                                    {ref.type}
                                  </Badge>
                                  <span className="text-gray-700">{ref.title}</span>
                                  <span className="text-gray-500">({ref.relationship_to_document})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                💡 Documents updates are processed separately from substrate changes to maintain canon purity.
              </p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}