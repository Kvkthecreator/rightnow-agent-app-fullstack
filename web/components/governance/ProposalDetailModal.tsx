/**
 * Canon-Compliant Proposal Detail Modal - Redesigned from First Principles
 * 
 * Clear information hierarchy:
 * 1. Header: Status, auto-approval indicator, metadata
 * 2. Operations: Clean breakdown of unified proposal operations
 * 3. Context: Provenance and confidence
 * 4. Actions: Clear approve/reject workflow
 * 
 * Fixes rendering issues with proper error boundaries and loading states
 */
"use client";

import { useState, useEffect } from 'react';
import { 
  X, CheckCircle, Clock, XCircle, Bot, User, Database, 
  FileText, MessageSquare, AlertTriangle, Info, Eye, 
  ChevronDown, ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ProposalOperation {
  type: string;
  data: Record<string, any>;
}

interface ProposalDetail {
  id: string;
  proposal_kind: string;
  origin: 'agent' | 'human';
  status: string;
  ops: ProposalOperation[];
  validator_report: {
    confidence: number;
    warnings: string[];
    impact_summary: string;
    ops_summary?: string;
  };
  created_at: string;
  auto_approved: boolean;
  reviewed_at: string | null;
  executed_at: string | null;
  review_notes: string;
  is_executed: boolean;
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
  const [expandedSections, setExpandedSections] = useState({
    operations: true,
    context: false,
    history: false
  });
  const [actionMode, setActionMode] = useState<'none' | 'approve' | 'reject'>('none');
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && proposalId) {
      fetchProposalDetail();
    } else {
      // Reset state when modal closes
      setProposal(null);
      setError(null);
      setActionMode('none');
      setActionNotes('');
    }
  }, [isOpen, proposalId]);

  const fetchProposalDetail = async () => {
    if (!proposalId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/baskets/${basketId}/proposals/${proposalId}`);
      if (!response.ok) {
        throw new Error(`Failed to load proposal: ${response.status}`);
      }
      const data = await response.json();
      setProposal(data);
    } catch (err) {
      console.error('Proposal fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAction = async () => {
    if (!proposal || !actionMode || submitting) return;
    
    setSubmitting(true);
    try {
      if (actionMode === 'approve') {
        await onApprove(proposal.id, actionNotes || 'Approved via detailed review');
      } else if (actionMode === 'reject') {
        await onReject(proposal.id, actionNotes || 'Rejected via detailed review');
      }
      onClose();
    } catch (err) {
      console.error('Action failed:', err);
      alert(`Failed to ${actionMode} proposal. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'CreateBlock': return <Database className="h-4 w-4 text-orange-600" />;
      case 'CreateContextItem': return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'CreateDump': return <FileText className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationSummary = (ops: ProposalOperation[]) => {
    const counts = ops.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parts = [];
    if (counts.CreateBlock) parts.push(`${counts.CreateBlock} block${counts.CreateBlock === 1 ? '' : 's'}`);
    if (counts.CreateContextItem) parts.push(`${counts.CreateContextItem} context item${counts.CreateContextItem === 1 ? '' : 's'}`);
    
    return parts.length > 0 ? `${parts.join(', ')}` : `${ops.length} operations`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {proposal?.origin === 'agent' ? <Bot className="h-5 w-5 text-purple-600" /> : <User className="h-5 w-5 text-blue-600" />}
              <h2 className="text-xl font-semibold text-gray-900">Proposal Detail</h2>
            </div>
            {proposal && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{proposal.proposal_kind}</Badge>
                <Badge 
                  variant={proposal.status === 'APPROVED' ? 'default' : proposal.status === 'PROPOSED' ? 'secondary' : 'outline'}
                  className={
                    proposal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    proposal.status === 'PROPOSED' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }
                >
                  {proposal.status}
                </Badge>
                {proposal.auto_approved && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-Approved
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="font-medium text-red-800">Error Loading Proposal</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={fetchProposalDetail} className="mt-3">
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {proposal && (
            <>
              {/* Summary */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {proposal.validator_report.ops_summary || getOperationSummary(proposal.ops)}
                      </h3>
                      <p className="text-gray-700">
                        {proposal.validator_report.impact_summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>Created: {new Date(proposal.created_at).toLocaleString()}</span>
                        {proposal.reviewed_at && (
                          <span>Reviewed: {new Date(proposal.reviewed_at).toLocaleString()}</span>
                        )}
                        {proposal.executed_at && (
                          <span>Executed: {new Date(proposal.executed_at).toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{width: `${proposal.validator_report.confidence * 100}%`}}
                          />
                        </div>
                        <span className="text-xs font-medium">{Math.round(proposal.validator_report.confidence * 100)}%</span>
                      </div>
                    </div>

                    {proposal.auto_approved && proposal.review_notes && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-800 font-medium text-sm">Auto-Approval Details</span>
                        </div>
                        <p className="text-green-700 text-sm mt-1">{proposal.review_notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Operations */}
              <Card>
                <CardHeader 
                  className="cursor-pointer" 
                  onClick={() => toggleSection('operations')}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Operations ({proposal.ops.length})
                    </div>
                    {expandedSections.operations ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </CardTitle>
                </CardHeader>
                {expandedSections.operations && (
                  <CardContent className="space-y-3">
                    {proposal.ops.map((op, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded">
                        {getOperationIcon(op.type)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{op.type}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {op.type === 'CreateBlock' && (
                              <div>
                                <div><strong>Title:</strong> {op.data.title || 'Untitled'}</div>
                                <div><strong>Type:</strong> {op.data.semantic_type || 'insight'}</div>
                                {op.data.confidence && <div><strong>Confidence:</strong> {Math.round(op.data.confidence * 100)}%</div>}
                              </div>
                            )}
                            {op.type === 'CreateContextItem' && (
                              <div>
                                <div><strong>Label:</strong> {op.data.label || 'Untitled'}</div>
                                <div><strong>Kind:</strong> {op.data.kind || 'concept'}</div>
                                {op.data.confidence && <div><strong>Confidence:</strong> {Math.round(op.data.confidence * 100)}%</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>

              {/* Warnings */}
              {proposal.validator_report.warnings.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-5 w-5" />
                      Validation Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {proposal.validator_report.warnings.map((warning, i) => (
                        <li key={i} className="text-yellow-700 text-sm">• {warning}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              {proposal.status === 'PROPOSED' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {actionMode === 'none' && (
                      <div className="flex gap-3">
                        <Button 
                          variant="primary"
                          onClick={() => setActionMode('approve')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve Proposal
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setActionMode('reject')}
                          className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject Proposal
                        </Button>
                      </div>
                    )}

                    {actionMode !== 'none' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {actionMode === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                          </label>
                          <textarea
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            placeholder={
                              actionMode === 'approve' 
                                ? 'Additional notes about the approval...'
                                : 'Please provide a reason for rejection...'
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            variant="primary"
                            onClick={handleAction}
                            disabled={submitting || (actionMode === 'reject' && !actionNotes.trim())}
                            className={actionMode === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                          >
                            {submitting ? (
                              <div className="animate-spin h-3.5 w-3.5 border-b-2 border-white rounded-full" />
                            ) : actionMode === 'approve' ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {submitting ? 'Processing...' : `${actionMode === 'approve' ? 'Approve' : 'Reject'}`}
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => {
                              setActionMode('none');
                              setActionNotes('');
                            }}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}