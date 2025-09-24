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

  const getOperationDisplayName = (type: string) => {
    // Canon-compliant user-friendly operation names
    switch (type) {
      case 'CreateBlock': return 'Create Knowledge Block';
      case 'CreateContextItem': return 'Add Context Item';
      case 'CreateDump': return 'Capture Raw Insights';
      case 'ReviseBlock': return 'Revise Knowledge Block';
      case 'UpdateContextItem': return 'Update Context Item';
      case 'AttachContextItem': return 'Link Context';
      case 'MergeContextItems': return 'Merge Context Items';
      case 'PromoteScope': return 'Promote Scope';
      case 'ArchiveBlock': return 'Archive Block';
      case 'RedactDump': return 'Redact Dump';
      default: return type.replace(/([A-Z])/g, ' $1').trim();
    }
  };

  const getCanonicalImpactTitle = (proposal: ProposalDetail) => {
    const opCounts = proposal.ops.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Canon-aligned impact descriptions focused on user value
    if (opCounts.CreateDump) {
      return `Knowledge Capture: ${opCounts.CreateDump} new insight${opCounts.CreateDump === 1 ? '' : 's'} captured`;
    }
    if (opCounts.CreateBlock && opCounts.CreateContextItem) {
      return `Knowledge Extraction: ${opCounts.CreateBlock} block${opCounts.CreateBlock === 1 ? '' : 's'} and ${opCounts.CreateContextItem} context item${opCounts.CreateContextItem === 1 ? '' : 's'}`;
    }
    if (opCounts.CreateBlock) {
      return `Knowledge Structuring: ${opCounts.CreateBlock} new knowledge block${opCounts.CreateBlock === 1 ? '' : 's'}`;
    }
    if (opCounts.CreateContextItem) {
      return `Context Enhancement: ${opCounts.CreateContextItem} new context item${opCounts.CreateContextItem === 1 ? '' : 's'}`;
    }
    
    return `Knowledge Update: ${proposal.ops.length} substrate operation${proposal.ops.length === 1 ? '' : 's'}`;
  };

  const getCanonicalImpactDescription = (proposal: ProposalDetail) => {
    const summary = proposal.validator_report.impact_summary;
    
    // Enhance technical summaries with user-focused language
    if (summary.includes('extraction')) {
      return `This proposal extracts structured knowledge from your captured insights, making them searchable and referenceable. ${summary}`;
    }
    if (summary.includes('capture')) {
      return `This proposal adds new raw insights to your knowledge base for future processing. ${summary}`;
    }
    if (summary.includes('context')) {
      return `This proposal enriches your knowledge with additional context and connections. ${summary}`;
    }
    
    return summary || 'This proposal will modify your knowledge substrate to improve organization and accessibility.';
  };

  const getSubstrateBreakdown = (ops: ProposalOperation[]) => {
    const counts = ops.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([type, count]) => ({
      type,
      count
    })).filter(item => item.count > 0);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'moments ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
              {/* Canon-Compliant Summary */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Primary Impact Statement - Clear User Value */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                        {getCanonicalImpactTitle(proposal)}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {getCanonicalImpactDescription(proposal)}
                      </p>
                    </div>

                    {/* Substrate Impact Breakdown - Canon Principle: Substrate Equality */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Substrate Changes
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {getSubstrateBreakdown(proposal.ops).map(item => (
                          <div key={item.type} className="text-center">
                            <div className="text-lg font-semibold text-blue-800">{item.count}</div>
                            <div className="text-xs text-blue-600 capitalize">{item.type.replace('Create', '')}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline and Confidence */}
                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(proposal.created_at)}
                        </span>
                        {proposal.reviewed_at && (
                          <span className="text-green-600">Reviewed {formatRelativeTime(proposal.reviewed_at)}</span>
                        )}
                        {proposal.executed_at && (
                          <span className="text-blue-600">Applied {formatRelativeTime(proposal.executed_at)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Quality Score:</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              proposal.validator_report.confidence >= 0.8 ? 'bg-green-500' :
                              proposal.validator_report.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{width: `${proposal.validator_report.confidence * 100}%`}}
                          />
                        </div>
                        <span className="text-xs font-medium">{Math.round(proposal.validator_report.confidence * 100)}%</span>
                      </div>
                    </div>

                    {/* Auto-Approval Enhancement */}
                    {proposal.auto_approved && proposal.review_notes && (
                      <div className="bg-gradient-to-r from-purple-50 to-green-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-800 font-medium text-sm">Intelligent Auto-Approval</span>
                        </div>
                        <p className="text-purple-700 text-sm leading-relaxed">{proposal.review_notes}</p>
                        <div className="text-xs text-purple-600 mt-2">
                          This proposal met quality thresholds for automatic processing while maintaining governance integrity.
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Operations Section - Canon Compliant */}
              <Card>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors" 
                  onClick={() => toggleSection('operations')}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      <span>Knowledge Operations</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {proposal.ops.length}
                      </Badge>
                    </div>
                    {expandedSections.operations ? 
                      <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    }
                  </CardTitle>
                </CardHeader>
                {expandedSections.operations && (
                  <CardContent className="space-y-4">
                    {proposal.ops.map((op, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start gap-3">
                          {getOperationIcon(op.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900">
                                {getOperationDisplayName(op.type)}
                              </div>
                              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                #{index + 1}
                              </div>
                            </div>
                            
                            {/* Canon-Compliant Operation Details */}
                            <div className="text-sm text-gray-700 space-y-1">
                              {op.type === 'CreateBlock' && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Title:</span>
                                    <span className="truncate">{op.data.title || 'Untitled Knowledge Block'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Type:</span>
                                    <Badge variant="outline" className="text-xs">
                                      {op.data.semantic_type || 'insight'}
                                    </Badge>
                                  </div>
                                  {op.data.confidence && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Quality:</span>
                                      <div className="flex items-center gap-1">
                                        <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                                          <div 
                                            className="h-1.5 bg-green-500 rounded-full"
                                            style={{width: `${op.data.confidence * 100}%`}}
                                          />
                                        </div>
                                        <span className="text-xs">{Math.round(op.data.confidence * 100)}%</span>
                                      </div>
                                    </div>
                                  )}
                                  {op.data.content && (
                                    <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600 italic truncate">
                                      "{op.data.content.substring(0, 80)}..."
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {op.type === 'CreateContextItem' && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Label:</span>
                                    <span className="truncate">{op.data.label || 'Untitled Context'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Kind:</span>
                                    <Badge variant="outline" className="text-xs">
                                      {op.data.kind || 'concept'}
                                    </Badge>
                                  </div>
                                  {op.data.confidence && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Quality:</span>
                                      <div className="flex items-center gap-1">
                                        <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                                          <div 
                                            className="h-1.5 bg-blue-500 rounded-full"
                                            style={{width: `${op.data.confidence * 100}%`}}
                                          />
                                        </div>
                                        <span className="text-xs">{Math.round(op.data.confidence * 100)}%</span>
                                      </div>
                                    </div>
                                  )}
                                  {op.data.description && (
                                    <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600 italic truncate">
                                      {op.data.description.substring(0, 80)}...
                                    </div>
                                  )}
                                </>
                              )}

                              {op.type === 'CreateDump' && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Source:</span>
                                    <span className="truncate">{op.data.source_meta?.source_type || 'Manual Input'}</span>
                                  </div>
                                  {op.data.text_dump && (
                                    <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600 italic">
                                      {op.data.text_dump.substring(0, 100)}...
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
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

              {/* Enhanced Review Actions - Canon Compliant */}
              {proposal.status === 'PROPOSED' && (
                <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-800">
                      <Eye className="h-5 w-5" />
                      Governance Decision Required
                    </CardTitle>
                    <p className="text-sm text-indigo-600 mt-1">
                      This proposal affects your knowledge substrate. Review the changes and make a governance decision.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {actionMode === 'none' && (
                      <>
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <h4 className="font-medium text-gray-900">Decision Impact</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Quality Score: {Math.round(proposal.validator_report.confidence * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-blue-600" />
                              <span>{proposal.ops.length} substrate operation{proposal.ops.length === 1 ? '' : 's'}</span>
                            </div>
                          </div>
                          {proposal.validator_report.warnings.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                              <div className="text-xs text-yellow-800">
                                <strong>Validation Concerns:</strong> {proposal.validator_report.warnings.length} warning{proposal.validator_report.warnings.length === 1 ? '' : 's'} detected
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <Button 
                            variant="primary"
                            onClick={() => setActionMode('approve')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept & Apply Changes
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setActionMode('reject')}
                            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 py-3"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Changes
                          </Button>
                        </div>
                      </>
                    )}

                    {actionMode !== 'none' && (
                      <div className="space-y-4 bg-white rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {actionMode === 'approve' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <h4 className={`font-medium ${actionMode === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                            {actionMode === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                          </h4>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {actionMode === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                          </label>
                          <textarea
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            placeholder={
                              actionMode === 'approve' 
                                ? 'Optional notes about why you approved this proposal...'
                                : 'Please explain why you are rejecting this proposal. This helps improve future proposals.'
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={3}
                          />
                          {actionMode === 'reject' && !actionNotes.trim() && (
                            <p className="text-xs text-red-600 mt-1">
                              A rejection reason is required to help improve future proposals.
                            </p>
                          )}
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button 
                            variant="primary"
                            onClick={handleAction}
                            disabled={submitting || (actionMode === 'reject' && !actionNotes.trim())}
                            className={`flex-1 py-3 ${actionMode === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                          >
                            {submitting ? (
                              <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />
                            ) : actionMode === 'approve' ? (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            {submitting ? 'Processing Decision...' : `${actionMode === 'approve' ? 'Approve & Apply' : 'Reject Proposal'}`}
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => {
                              setActionMode('none');
                              setActionNotes('');
                            }}
                            disabled={submitting}
                            className="px-6"
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