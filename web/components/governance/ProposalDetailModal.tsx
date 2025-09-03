"use client";

import { useState, useEffect } from 'react';
import { X, FileText, Database, FolderOpen, Lightbulb, Clock, AlertTriangle, CheckCircle, Brain, Eye, Layers } from 'lucide-react';
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
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      await onApprove(proposal.id, approvalNotes);
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

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'CreateDump': return <Database className="h-4 w-4 text-green-600" />;
      case 'CreateBlock': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'CreateContextItem': return <FolderOpen className="h-4 w-4 text-purple-600" />;
      case 'ReviseBlock': return <FileText className="h-4 w-4 text-orange-600" />;
      case 'EditContextItem': return <FolderOpen className="h-4 w-4 text-orange-600" />;
      case 'AttachContextItem': return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'MergeContextItems': return <Lightbulb className="h-4 w-4 text-red-600" />;
      case 'PromoteScope': return <Brain className="h-4 w-4 text-indigo-600" />;
      case 'DocumentCompose': return <FileText className="h-4 w-4 text-gray-600" />;
      case 'Delete': return <X className="h-4 w-4 text-red-600" />;
      default: return <Eye className="h-4 w-4 text-gray-400" />;
    }
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

  const formatOperationNarrative = (op: ProposalOperation) => {
    switch (op.type) {
      case 'CreateDump':
        return `Create new content dump from source`;
      case 'CreateBlock':
        return `Create new structured block`;
      case 'CreateContextItem':
        return `Add new context item to workspace`;
      case 'ReviseBlock':
        return `Update existing block content`;
      case 'EditContextItem':
        return `Modify context item details`;
      case 'AttachContextItem':
        return `Link context item to current scope`;
      case 'MergeContextItems':
        return `Combine multiple context items`;
      case 'PromoteScope':
        return `Elevate item to broader scope`;
      case 'DocumentCompose':
        return `Compose document from substrate`;
      case 'Delete':
        return `Remove item from workspace`;
      default:
        return `Execute ${op.type} operation`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Proposal Review</h2>
              {proposal && (
                <p className="text-sm text-gray-500 mt-1">
                  ID: {proposal.id.slice(0, 8)}... • {proposal.proposal_kind} • {proposal.origin}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
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
                
                {/* Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Proposal Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <Badge variant={proposal.status === 'PROPOSED' ? 'default' : 'secondary'}>
                          {proposal.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Blast Radius</p>
                        <Badge className={getBlastRadiusColor(proposal.blast_radius)}>
                          {proposal.blast_radius}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Confidence</p>
                        <Badge className={getConfidenceColor(proposal.validator_report.confidence)}>
                          {Math.round(proposal.validator_report.confidence * 100)}%
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Operations</p>
                        <span className="text-sm font-medium">{proposal.ops.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Impact Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Impact Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{proposal.validator_report.impact_summary}</p>
                    
                    {proposal.validator_report.warnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <h4 className="flex items-center gap-2 text-sm font-medium text-yellow-800 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          Validation Warnings
                        </h4>
                        <ul className="space-y-1">
                          {proposal.validator_report.warnings.map((warning, i) => (
                            <li key={i} className="text-sm text-yellow-700">• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {proposal.validator_report.ontology_hits.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Ontology Matches</h4>
                        <div className="flex flex-wrap gap-2">
                          {proposal.validator_report.ontology_hits.map((hit, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{hit}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Change Impact Narrative */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Change Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Impact Summary - Main Narrative */}
                      <div className="prose prose-sm max-w-none">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                          <div className="text-gray-900 leading-relaxed text-base">
                            {proposal.validator_report.impact_summary}
                          </div>
                        </div>
                      </div>

                      {/* Blast Radius & Scope */}
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Scope:</span>
                          <Badge className={getBlastRadiusColor(proposal.blast_radius)}>
                            {proposal.blast_radius}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Operations:</span>
                          <span className="text-sm text-gray-600">{proposal.ops.length} changes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Origin:</span>
                          <Badge variant="outline">{proposal.origin}</Badge>
                        </div>
                      </div>

                      {/* Detailed Operations */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 text-sm">Proposed Operations:</h4>
                        {proposal.ops.map((op, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              {getOperationIcon(op.type)}
                              <span className="font-medium text-gray-900 text-sm">
                                {formatOperationNarrative(op)}
                              </span>
                            </div>
                            {op.data.title && (
                              <div className="text-sm text-gray-700 font-medium">
                                "{op.data.title}"
                              </div>
                            )}
                            {(op.data.content || op.data.body_md || op.data.text_dump) && (
                              <div className="mt-1 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                                {(op.data.content || op.data.body_md || op.data.text_dump || '').substring(0, 150)}
                                {(op.data.content || op.data.body_md || op.data.text_dump || '').length > 150 && '...'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Substrate Context & Provenance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Change Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Provenance Chain */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Triggered by:</h4>
                        <div className="space-y-2">
                          {proposal.provenance.map((entry, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className={`
                                inline-flex items-center px-2 py-1 rounded text-xs font-medium
                                ${entry.type === 'doc' ? 'bg-blue-100 text-blue-800' : ''}
                                ${entry.type === 'user' ? 'bg-green-100 text-green-800' : ''}
                                ${entry.type === 'block' ? 'bg-purple-100 text-purple-800' : ''}
                                ${entry.type === 'dump' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${!['doc', 'user', 'block', 'dump'].includes(entry.type) ? 'bg-gray-100 text-gray-800' : ''}
                              `}>
                                {entry.type}
                              </div>
                              <span className="text-sm font-mono text-gray-600">
                                {entry.id.slice(0, 8)}...
                              </span>
                              {entry.metadata && (
                                <span className="text-xs text-gray-500">
                                  {Object.entries(entry.metadata).map(([key, value]) => 
                                    `${key}: ${value}`
                                  ).join(', ')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Substrate Scope Analysis */}
                      {proposal.ops.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Substrate Types Affected:</h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(proposal.ops.map(op => op.type))).map(opType => (
                              <div key={opType} className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full">
                                {getOperationIcon(opType)}
                                <span className="text-xs font-medium text-gray-700">
                                  {opType.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
            ) : null}
          </div>

          {/* Action Footer */}
          {proposal && proposal.status === 'PROPOSED' && (
            <div className="border-t p-6 bg-gray-50">
              {!showRejectForm ? (
                <div className="space-y-4">
                  {/* Approval Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes (Optional)
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add any notes about this approval..."
                      className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      disabled={submitting}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    
                    <Button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={submitting}
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