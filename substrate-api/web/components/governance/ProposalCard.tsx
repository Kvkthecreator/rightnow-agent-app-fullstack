/**
 * Canon-Compliant Proposal Card
 * 
 * Shows what users need to know:
 * - WHAT is changing in their knowledge base
 * - WHY this change is being suggested
 * - WHETHER they should trust this change
 * - HOW urgently they need to act
 */
"use client";

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, Clock, Eye, Plus, Edit, Link2, Archive } from 'lucide-react';

interface ProposalCardProps {
  proposal: {
    id: string;
    proposal_kind: string;
    ops_summary: string;
    ops?: Array<{ type: string; data: any }>;
    validator_report: {
      confidence: number;
      warnings: Array<string | { severity: 'critical' | 'warning' | 'info'; message: string }>;
      impact_summary: string;
    };
    blast_radius: 'Local' | 'Scoped' | 'Global';
    created_at: string;
    status: string;
    origin: 'agent' | 'human';
    auto_approved?: boolean;
    executed_at?: string | null;
    reviewed_at?: string | null;
    review_notes?: string | null;
  };
  onReview: (proposalId: string) => void;
  onQuickApprove?: (proposalId: string) => void;
}

export function ProposalCard({ proposal, onReview, onQuickApprove }: ProposalCardProps) {
  const isPending = proposal.status === 'PROPOSED';
  const isExecuted = proposal.status === 'EXECUTED' || proposal.status === 'APPROVED';
  const isRejected = proposal.status === 'REJECTED';
  const isAutoApproved = !!proposal.auto_approved;

  const confidence = typeof proposal?.validator_report?.confidence === 'number'
    ? proposal.validator_report.confidence
    : 0.5;
  const warnings = Array.isArray(proposal?.validator_report?.warnings)
    ? proposal.validator_report.warnings
    : [] as Array<string | { severity: 'critical' | 'warning' | 'info'; message: string }>;
  
  const criticalWarnings = warnings.filter(w => {
    if (typeof w === 'string') {
      return w.includes('CRITICAL') || w.includes('CONFLICT');
    }
    return w.severity === 'critical' || 
           (w.message.includes('CRITICAL') || w.message.includes('CONFLICT'));
  });
  
  // Determine risk level for visual priority
  const getRiskLevel = (): 'critical' | 'review' | 'ready' => {
    if (criticalWarnings.length > 0) return 'critical';
    if (confidence < 0.7 || warnings.length > 0) return 'review';
    return 'ready';
  };

  const riskLevel = getRiskLevel();

  const getCardStyle = () => {
    switch (riskLevel) {
      case 'critical': return 'border-red-200 bg-red-50/30';
      case 'review': return 'border-yellow-200 bg-yellow-50/30';  
      case 'ready': return 'border-green-200 bg-green-50/30';
    }
  };

  // Get human-readable action type and icon
  const getActionInfo = () => {
    const ops = Array.isArray(proposal.ops) ? proposal.ops : [];
    const primaryOp = ops[0];
    
    if (!primaryOp) {
      return { icon: <Eye className="h-4 w-4 text-gray-500" />, action: 'Review changes' };
    }
    
    // Count operation types
    const opCounts = ops.reduce((acc, op) => {
      const category = op.type.includes('Create') ? 'new' : 
                      op.type.includes('Revise') || op.type.includes('Edit') ? 'update' :
                      op.type.includes('Merge') || op.type.includes('Attach') ? 'connect' :
                      op.type.includes('Archive') || op.type.includes('Delete') ? 'remove' : 'change';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Determine primary action type
    const primaryAction = Object.entries(opCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'change';
    
    switch (primaryAction) {
      case 'new':
        return { 
          icon: <Plus className="h-4 w-4 text-green-600" />, 
          action: `Adding ${opCounts.new} new ${opCounts.new === 1 ? 'item' : 'items'}` 
        };
      case 'update':
        return { 
          icon: <Edit className="h-4 w-4 text-blue-600" />, 
          action: `Updating ${opCounts.update} ${opCounts.update === 1 ? 'item' : 'items'}` 
        };
      case 'connect':
        return { 
          icon: <Link2 className="h-4 w-4 text-purple-600" />, 
          action: `Connecting ${opCounts.connect} ${opCounts.connect === 1 ? 'item' : 'items'}` 
        };
      case 'remove':
        return { 
          icon: <Archive className="h-4 w-4 text-red-600" />, 
          action: `Removing ${opCounts.remove} ${opCounts.remove === 1 ? 'item' : 'items'}` 
        };
      default:
        return { 
          icon: <Eye className="h-4 w-4 text-gray-500" />, 
          action: 'Review changes' 
        };
    }
  };

  const actionInfo = getActionInfo();
  
  // Get trust indicator text
  const getTrustText = () => {
    if (confidence > 0.8) return 'High confidence';
    if (confidence > 0.6) return 'Moderate confidence';
    return 'Needs review';
  };

  // Format age in human terms
  const formatAge = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`border rounded-lg ${getCardStyle()} hover:shadow-sm transition-shadow`}>
      <div className="p-4">
        {/* Primary: What's Changing */}
        <div className="flex items-start gap-3 mb-3">
          {actionInfo.icon}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {actionInfo.action} to your knowledge base
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2">
              {proposal.validator_report.impact_summary || proposal.ops_summary}
            </p>
          </div>
          
          {/* Source Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {proposal.origin === 'agent' ? '🤖 AI' : '👤 Manual'}
            </Badge>
            {renderStatusBadge(proposal.status, isAutoApproved)}
          </div>
        </div>

        {/* Critical Warning (if any) */}
        {criticalWarnings.length > 0 && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            {typeof criticalWarnings[0] === 'string' 
              ? criticalWarnings[0] 
              : criticalWarnings[0].message || 'Review required - potential issues detected'}
          </div>
        )}

        {/* Decision Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            {/* Trust Indicator */}
            <span className={`font-medium ${
              confidence > 0.8 ? 'text-green-600' : 
              confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {getTrustText()}
            </span>
            
            {/* Scope */}
            <span className="text-gray-500">
              Affects: {proposal.blast_radius === 'Local' ? 'This topic' : 
                       proposal.blast_radius === 'Scoped' ? 'Related topics' : 'Entire workspace'}
            </span>
            
            {/* Age */}
            <span className="text-gray-400">
              {formatAge(isExecuted && proposal.executed_at ? proposal.executed_at : proposal.created_at)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onReview(proposal.id)}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              Details
            </Button>
            
            {isPending && riskLevel === 'ready' && onQuickApprove && (
              <Button
                onClick={() => onQuickApprove(proposal.id)}
                size="sm"
                className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Accept
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderStatusBadge(status?: string, autoApproved?: boolean) {
  if (!status) return null;
  const base = 'text-xs px-2 py-1 rounded-full border';
  switch (status) {
    case 'PROPOSED':
      return <Badge variant="outline" className="text-xs">Pending</Badge>;
    case 'EXECUTED':
      return (
        <Badge variant="outline" className={`${base} ${autoApproved ? 'border-green-400 text-green-700 bg-green-50' : 'border-blue-300 text-blue-700 bg-blue-50'}`}>
          {autoApproved ? 'Auto-approved' : 'Executed'}
        </Badge>
      );
    case 'APPROVED':
      return <Badge variant="outline" className={`${base} border-blue-300 text-blue-700 bg-blue-50`}>Approved</Badge>;
    case 'REJECTED':
      return <Badge variant="outline" className={`${base} border-red-300 text-red-700 bg-red-50`}>Rejected</Badge>;
    default:
      return <Badge variant="outline" className="text-xs capitalize">{status.toLowerCase()}</Badge>;
  }
}
