"use client";

import { useState, useEffect } from 'react';
import { X, FileText, Database, FolderOpen, Lightbulb, Clock, AlertTriangle, CheckCircle, Brain, Eye, Layers, ChevronDown, ChevronRight, Edit, Plus, Trash2, GitBranch, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { createBrowserClient } from '@/lib/supabase/clients';
import { previewDocumentImpacts, getConfidenceLevel, getConfidenceColor, getImpactTypeIcon } from '@/lib/artifacts/documentImpactPreview';
import type { DocumentImpactPreview } from '@/lib/artifacts/documentImpactPreview';

interface ProposalOperation {
  type: string;
  data: Record<string, any>;
}

interface ProposalDetail {
  id: string;
  proposal_kind: string;
  origin: 'agent' | 'human';
  status: string;
  blast_radius: 'Local' | 'Scoped' | 'Global';
  ops: ProposalOperation[];
  validator_report: {
    confidence: number;
    dupes: any[];
    warnings: string[];
    suggested_merges: string[];
    ontology_hits: string[];
    impact_summary: string;
  };
  provenance: Array<{
    type: string;
    id: string;
    metadata?: Record<string, any>;
  }>;
  created_at: string;
  created_by?: string;
}

interface ProposalDetailModalProps {
  isOpen: boolean;
  proposalId: string | null;
  basketId: string;
  onClose: () => void;
  onApprove: (proposalId: string, notes?: string) => Promise<void>;
  onReject: (proposalId: string, reason: string) => Promise<void>;
}

export function ProposalDetailModal({ 
  isOpen, 
  proposalId, 
  basketId, 
  onClose, 
  onApprove, 
  onReject 
}: ProposalDetailModalProps) {
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestChangesReason, setRequestChangesReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    changes: true,
    context: false,
    impact: false,
    documents: false
  });
  const [documentImpactPreviews, setDocumentImpactPreviews] = useState<DocumentImpactPreview[]>([]);

  useEffect(() => {
    if (isOpen && proposalId) {
      fetchProposalDetail();
    }
  }, [isOpen, proposalId]);

  const fetchProposalDetail = async () => {
    if (!proposalId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/baskets/${basketId}/proposals/${proposalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch proposal details');
      }
      const data = await response.json();
      setProposal(data);
      
      // Fetch document impact preview (read-only)
      await fetchDocumentImpactPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentImpactPreview = async (proposal: ProposalDetail) => {
    try {
      const supabase = createBrowserClient();
      const previews = await previewDocumentImpacts(
        supabase,
        proposal.ops,
        proposal.workspace_id,
        basketId
      );
      setDocumentImpactPreviews(previews);
    } catch (err) {
      console.error('Failed to fetch document impact preview:', err);
      setDocumentImpactPreviews([]);
    }
  };

  const handleApprove = async () => {
    if (!proposal) return;
    
    setSubmitting(true);
    try {
      await onApprove(proposal.id, reviewNotes);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!proposal || !requestChangesReason.trim()) return;
    
    setSubmitting(true);
    try {
      // Update proposal status to UNDER_REVIEW with request changes reason
      const response = await fetch(`/api/baskets/${basketId}/proposals/${proposal.id}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          review_notes: requestChangesReason,
          status: 'UNDER_REVIEW'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to request changes');
      }
      
      setShowRequestChanges(false);
      setRequestChangesReason('');
      onClose();
      // Parent component should refresh the proposals list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request changes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!proposal || !rejectReason.trim()) return;
    
    setSubmitting(true);
    try {
      await onReject(proposal.id, rejectReason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'CreateDump': return <Plus className="h-4 w-4 text-green-600" />;
      case 'CreateBlock': return <Plus className="h-4 w-4 text-blue-600" />;
      case 'CreateContextItem': return <Plus className="h-4 w-4 text-purple-600" />;
      case 'ReviseBlock': return <Edit className="h-4 w-4 text-orange-600" />;
      case 'EditContextItem': return <Edit className="h-4 w-4 text-orange-600" />;
      case 'AttachContextItem': return <GitBranch className="h-4 w-4 text-yellow-600" />;
      case 'MergeContextItems': return <GitBranch className="h-4 w-4 text-red-600" />;
      case 'PromoteScope': return <Brain className="h-4 w-4 text-indigo-600" />;
      case 'Delete': return <Trash2 className="h-4 w-4 text-red-600" />;
      // REMOVED: DocumentCompose - documents are artifacts, not substrates
      default: return <Eye className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatOperationDescription = (op: ProposalOperation) => {
    switch (op.type) {
      case 'CreateDump':
        return `Add new content to workspace`;
      case 'CreateBlock':
        return `Create new knowledge block${op.data.title ? `: "${op.data.title}"` : ''}`;
      case 'CreateContextItem':
        return `Add context item${op.data.label ? `: "${op.data.label}"` : ''}`;
      case 'ReviseBlock':
        return `Update existing content${op.data.title ? `: "${op.data.title}"` : ''}`;
      case 'EditContextItem':
        return `Modify context${op.data.label ? `: "${op.data.label}"` : ''}`;
      case 'AttachContextItem':
        return `Connect context to current scope`;
      case 'MergeContextItems':
        return `Combine related context items`;
      case 'PromoteScope':
        return `Expand scope to workspace level`;
      // REMOVED: DocumentCompose - documents are artifacts, not substrates
      case 'Delete':
        return `Remove from workspace`;
      default:
        return `Execute ${op.type} operation`;
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getAffectedSubstrateTypes = (ops: ProposalOperation[]) => {
    const types = new Set<string>();
    ops.forEach(op => {
      if (op.type.includes('Block')) types.add('blocks');
      if (op.type.includes('Dump')) types.add('dumps');
      if (op.type.includes('ContextItem')) types.add('context items');
      if (op.type.includes('Timeline')) types.add('timeline events');
    });
    return Array.from(types);
  };

  const getBlastRadiusColor = (radius: string) => {
    switch (radius) {
      case 'Local': return 'text-green-600 bg-green-50';
      case 'Scoped': return 'text-yellow-600 bg-yellow-50';
      case 'Global': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const hasBlockingWarnings = (proposal: ProposalDetail) => {
    return proposal.validator_report.confidence < 0.3 || 
           proposal.validator_report.warnings.some(w => w.includes('CRITICAL'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Streamlined Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Change Request Review</h2>
              {proposal && (
                <p className="text-sm text-gray-500 mt-1">
                  {proposal.proposal_kind} • {proposal.origin} • {new Date(proposal.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchProposalDetail}>Retry</Button>
              </div>
            ) : proposal ? (
              <div className="p-6 space-y-6">
                
                {/* PRIMARY: Decision Context (Always Visible) */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {proposal.validator_report.impact_summary || "Changes to workspace substrate"}
                  </h3>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant={proposal.origin === 'agent' ? 'default' : 'secondary'}>
                      {proposal.origin === 'agent' ? 'AI Proposed' : 'User Proposed'}
                    </Badge>
                    <Badge className={getBlastRadiusColor(proposal.blast_radius)}>
                      {proposal.blast_radius} Impact
                    </Badge>
                    <Badge variant="outline">
                      {proposal.ops.length} {proposal.ops.length === 1 ? 'change' : 'changes'}
                    </Badge>
                  </div>

                  {/* Risk Assessment */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Confidence:</span>
                      <Badge className={getConfidenceColor(proposal.validator_report.confidence)}>
                        {Math.round(proposal.validator_report.confidence * 100)}%
                      </Badge>
                    </div>
                    
                    {proposal.validator_report.warnings.length > 0 && (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {proposal.validator_report.warnings.length} warnings
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Inline Warnings */}
                  {proposal.validator_report.warnings.length > 0 && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">Review Required:</h4>
                      <ul className="space-y-1">
                        {proposal.validator_report.warnings.slice(0, 3).map((warning, i) => (
                          <li key={i} className="text-sm text-yellow-700">• {warning}</li>
                        ))}
                        {proposal.validator_report.warnings.length > 3 && (
                          <li className="text-sm text-yellow-600 italic">
                            +{proposal.validator_report.warnings.length - 3} more warnings
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* SECONDARY: Expandable Sections */}
                <div className="space-y-4">
                  
                  {/* What's Changing Section */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('changes')}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">What's Changing</span>
                        <Badge variant="outline" className="text-xs">
                          {proposal.ops.length} operations
                        </Badge>
                      </div>
                      {expandedSections.changes ? 
                        <ChevronDown className="h-4 w-4 text-gray-400" /> : 
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                    
                    {expandedSections.changes && (
                      <div className="border-t border-gray-200 p-4 space-y-3">
                        {proposal.ops.map((op, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded">
                            {getOperationIcon(op.type)}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">
                                {formatOperationDescription(op)}
                              </div>
                              {(op.data.content || op.data.body_md) && (
                                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  {(op.data.content || op.data.body_md).substring(0, 120)}
                                  {(op.data.content || op.data.body_md).length > 120 && '...'}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Why This Change Section */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('context')}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">Why This Change</span>
                      </div>
                      {expandedSections.context ? 
                        <ChevronDown className="h-4 w-4 text-gray-400" /> : 
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                    
                    {expandedSections.context && (
                      <div className="border-t border-gray-200 p-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Triggered by:</h4>
                            <div className="flex flex-wrap gap-2">
                              {proposal.provenance.map((entry, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {entry.type}: {entry.id.slice(0, 8)}...
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {proposal.validator_report.ontology_hits.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Related concepts:</h4>
                              <div className="flex flex-wrap gap-2">
                                {proposal.validator_report.ontology_hits.map((hit, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                    {hit}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Impact Analysis Section */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('impact')}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">Impact Analysis</span>
                      </div>
                      {expandedSections.impact ? 
                        <ChevronDown className="h-4 w-4 text-gray-400" /> : 
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                    
                    {expandedSections.impact && (
                      <div className="border-t border-gray-200 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Substrate affected:</h4>
                            <div className="space-y-1">
                              {getAffectedSubstrateTypes(proposal.ops).map(type => (
                                <div key={type} className="text-sm text-gray-600">• {type}</div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Scope:</h4>
                            <div className="text-sm text-gray-600">
                              <Badge className={getBlastRadiusColor(proposal.blast_radius)}>
                                {proposal.blast_radius}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Document Impact Preview Section (Read-Only) */}
                  {documentImpactPreviews.length > 0 && (
                    <div className="border border-blue-200 rounded-lg bg-blue-50/30">
                      <button
                        onClick={() => toggleSection('documents')}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-50"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Document Impact Preview</span>
                          <Badge variant="outline" className="text-xs bg-white">
                            {documentImpactPreviews.length} document{documentImpactPreviews.length === 1 ? '' : 's'}
                          </Badge>
                        </div>
                        {expandedSections.documents ? 
                          <ChevronDown className="h-4 w-4 text-blue-400" /> : 
                          <ChevronRight className="h-4 w-4 text-blue-400" />
                        }
                      </button>
                      
                      {expandedSections.documents && (
                        <div className="border-t border-blue-200 p-4 bg-white">
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs text-blue-700 font-medium mb-1">📋 Read-Only Preview</p>
                            <p className="text-xs text-blue-600">
                              These documents may be affected by the substrate changes. Document update decisions will be handled separately after substrate approval.
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            {documentImpactPreviews.map(preview => {
                              const confidenceLevel = getConfidenceLevel(preview.confidence_score);
                              const confidenceColor = getConfidenceColor(confidenceLevel);
                              const impactIcon = getImpactTypeIcon(preview.impact_type);
                              
                              return (
                                <div key={preview.document_id} className="border border-gray-100 rounded p-3 bg-gray-50">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{impactIcon}</span>
                                      <div>
                                        <h5 className="font-medium text-gray-900 text-sm">
                                          {preview.document_title}
                                        </h5>
                                        <p className="text-xs text-gray-600 mt-1">
                                          {preview.impact_summary}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {preview.affected_references_count} refs
                                      </Badge>
                                      <Badge className={`text-xs ${confidenceColor}`}>
                                        {confidenceLevel} confidence
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 bg-white p-2 rounded border">
                                    {preview.preview_description}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800">
                              💡 <strong>Next Steps:</strong> After substrate approval, you'll be notified to review and approve document updates separately.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ) : null}
          </div>

          {/* Action Footer */}
          {proposal && proposal.status === 'PROPOSED' && (
            <div className="border-t p-6 bg-gray-50">
              {!showRejectForm ? (
                <div className="space-y-4">
                  {/* Review Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes (Optional)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add any notes about this review..."
                      className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none"
                      rows={3}
                    />
                  </div>
                  
                  {/* Git-style Action Panel */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowRejectForm(true)}
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        disabled={submitting}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      
                      {!showRequestChanges ? (
                        <Button
                          onClick={() => setShowRequestChanges(true)}
                          variant="outline"
                          className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          disabled={submitting}
                        >
                          Request Changes
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setShowRequestChanges(false);
                            setRequestChangesReason('');
                          }}
                          variant="ghost"
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={submitting || (proposal && hasBlockingWarnings(proposal))}
                      title={proposal && hasBlockingWarnings(proposal) ? 'Cannot approve - critical warnings present' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {submitting ? 'Approving...' : 'Approve & Execute'}
                    </Button>
                  </div>
                  
                  {/* Request Changes Form */}
                  {showRequestChanges && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-yellow-800 mb-2">
                          What changes are needed? <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={requestChangesReason}
                          onChange={(e) => setRequestChangesReason(e.target.value)}
                          placeholder="Please describe what changes are needed before this can be approved..."
                          className="w-full p-3 border border-yellow-300 rounded-md text-sm resize-none bg-white"
                          rows={3}
                          autoFocus
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          onClick={handleRequestChanges}
                          className="bg-yellow-600 hover:bg-yellow-700"
                          disabled={submitting || !requestChangesReason.trim()}
                        >
                          {submitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Please explain why this proposal should be rejected..."
                      className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none"
                      rows={4}
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                      }}
                      variant="ghost"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      onClick={handleReject}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={submitting || !rejectReason.trim()}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}