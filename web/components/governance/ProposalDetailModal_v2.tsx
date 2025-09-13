/**
 * Focused Proposal Detail Modal - First Principles Refactor
 * 
 * Eliminates redundancy and focuses on decision-critical information:
 * 1. Clear change summary (what's happening)
 * 2. Risk assessment (confidence + warnings) 
 * 3. Essential context (why + impact)
 * 4. Clean action interface
 * 
 * Secondary information (provenance, document impacts, etc.) available but not prominent.
 */
"use client";

import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, GitBranch, Brain, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
    warnings: string[];
    impact_summary: string;
  };
  provenance: Array<{
    type: string;
    id: string;
  }>;
  created_at: string;
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
  const [rejectReason, setRejectReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposal');
    } finally {
      setLoading(false);
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-600 bg-green-50';
    if (confidence > 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getBlastRadiusColor = (radius: string) => {
    switch (radius) {
      case 'Local': return 'text-green-600 bg-green-50';
      case 'Scoped': return 'text-yellow-600 bg-yellow-50';
      case 'Global': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const hasCriticalWarnings = (proposal: ProposalDetail) => {
    return proposal.validator_report.warnings.some(w => 
      w.includes('CRITICAL') || w.includes('CONFLICT') || proposal.validator_report.confidence < 0.3
    );
  };

  const summarizeChanges = (ops: ProposalOperation[]) => {
    const counts = ops.reduce((acc, op) => {
      const category = op.type.includes('Create') ? 'creating' : 
                     op.type.includes('Revise') || op.type.includes('Edit') ? 'updating' :
                     op.type.includes('Merge') || op.type.includes('Attach') ? 'connecting' :
                     op.type.includes('Delete') ? 'removing' : 'modifying';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actions = Object.entries(counts).map(([action, count]) => 
      `${action} ${count} item${count === 1 ? '' : 's'}`
    );

    return actions.join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
          {/* Clean Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Change Request Review
              </h2>
              {proposal && (
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Badge variant="outline" className="text-xs">
                    {proposal.origin === 'agent' ? 'AI' : 'User'}
                  </Badge>
                  <Clock className="h-3 w-3" />
                  {new Date(proposal.created_at).toLocaleDateString()}
                </div>
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
                
                {/* PRIMARY: What's Changing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {proposal.validator_report.impact_summary}
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Changes: {summarizeChanges(proposal.ops)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Impact: <Badge className={getBlastRadiusColor(proposal.blast_radius)}>
                        {proposal.blast_radius}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* RISK ASSESSMENT */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Risk Assessment</h4>
                    <Badge className={getConfidenceColor(proposal.validator_report.confidence)}>
                      {Math.round(proposal.validator_report.confidence * 100)}% Confidence
                    </Badge>
                  </div>

                  {/* Critical Warnings Only */}
                  {hasCriticalWarnings(proposal) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-medium text-red-800 mb-1">
                            Critical Issues Detected
                          </h5>
                          <ul className="space-y-1">
                            {proposal.validator_report.warnings
                              .filter(w => w.includes('CRITICAL') || w.includes('CONFLICT'))
                              .slice(0, 3)
                              .map((warning, i) => (
                                <li key={i} className="text-sm text-red-700">• {warning}</li>
                              ))}
                          </ul>
                          {proposal.validator_report.confidence < 0.3 && (
                            <p className="text-sm text-red-700 mt-2">
                              • Very low confidence score - manual review strongly recommended
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Other Warnings - Collapsible */}
                  {proposal.validator_report.warnings.length > 0 && !hasCriticalWarnings(proposal) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          {proposal.validator_report.warnings.length} warnings detected
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECONDARY: Expandable Details */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Technical Details
                  </button>
                  
                  {showDetails && (
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-gray-700">Operations:</span>
                          <div className="mt-1 space-y-1">
                            {proposal.ops.slice(0, 3).map((op, i) => (
                              <div key={i} className="text-gray-600">• {op.type}</div>
                            ))}
                            {proposal.ops.length > 3 && (
                              <div className="text-gray-500 italic">+{proposal.ops.length - 3} more</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Triggered by:</span>
                          <div className="mt-1 space-y-1">
                            {proposal.provenance.slice(0, 2).map((entry, i) => (
                              <div key={i} className="text-gray-600">
                                • {entry.type}: {entry.id.slice(0, 8)}...
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* All Warnings in Detail View */}
                      {proposal.validator_report.warnings.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">All Warnings:</span>
                          <ul className="mt-1 space-y-1">
                            {proposal.validator_report.warnings.map((warning, i) => (
                              <li key={i} className="text-gray-600 text-xs">• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Clean Action Footer */}
          {proposal && proposal.status === 'PROPOSED' && (
            <div className="border-t p-6 bg-gray-50">
              {!showRejectForm ? (
                <div className="space-y-4">
                  {/* Optional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes (Optional)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about this review..."
                      className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none"
                      rows={2}
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      disabled={submitting}
                    >
                      Reject
                    </Button>
                    
                    <Button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={submitting || hasCriticalWarnings(proposal)}
                      title={hasCriticalWarnings(proposal) ? 'Cannot approve - critical issues detected' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {submitting ? 'Approving...' : 'Approve & Execute'}
                    </Button>
                  </div>
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
                      placeholder="Explain why this proposal should be rejected..."
                      className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none"
                      rows={3}
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