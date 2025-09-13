/**
 * Distilled Proposal Card - First Principles Refactor
 * 
 * Focuses on decision-critical information only:
 * - What's changing (single clear summary)
 * - Risk assessment (confidence + critical issues)
 * - Action urgency (based on confidence + warnings)
 * - Primary action (approve/investigate)
 */
"use client";

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, Clock, Eye, GitBranch } from 'lucide-react';

interface ProposalCardProps {
  proposal: {
    id: string;
    proposal_kind: string;
    ops_summary: string;
    validator_report: {
      confidence: number;
      warnings: string[];
      impact_summary: string;
    };
    blast_radius: 'Local' | 'Scoped' | 'Global';
    created_at: string;
    status: string;
  };
  onReview: (proposalId: string) => void;
  onQuickApprove?: (proposalId: string) => void;
}

export function ProposalCard({ proposal, onReview, onQuickApprove }: ProposalCardProps) {
  const confidence = proposal.validator_report.confidence;
  const hasWarnings = proposal.validator_report.warnings.length > 0;
  const hasCriticalWarnings = proposal.validator_report.warnings.some(w => 
    w.includes('CRITICAL') || w.includes('CONFLICT')
  );

  // Determine action priority based on confidence and warnings
  const getActionPriority = () => {
    if (hasCriticalWarnings) return 'critical'; // Red - needs investigation
    if (confidence < 0.6 || hasWarnings) return 'caution'; // Yellow - review needed
    if (confidence > 0.8) return 'ready'; // Green - can quick approve
    return 'normal'; // Blue - standard review
  };

  const priority = getActionPriority();

  const getBorderColor = () => {
    switch (priority) {
      case 'critical': return 'border-red-200 bg-red-50/30';
      case 'caution': return 'border-yellow-200 bg-yellow-50/30';  
      case 'ready': return 'border-green-200 bg-green-50/30';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getConfidenceDisplay = () => {
    const percent = Math.round(confidence * 100);
    if (confidence > 0.8) return { text: `${percent}%`, color: 'text-green-600' };
    if (confidence > 0.6) return { text: `${percent}%`, color: 'text-yellow-600' };
    return { text: `${percent}%`, color: 'text-red-600' };
  };

  const confidenceDisplay = getConfidenceDisplay();

  return (
    <div className={`border rounded-lg ${getBorderColor()} hover:shadow-sm transition-shadow`}>
      <div className="p-4">
        {/* Header: Change Summary + Risk Indicator */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {proposal.ops_summary}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {proposal.validator_report.impact_summary}
            </p>
          </div>
          
          {/* Risk Indicator */}
          <div className="flex items-center gap-2 ml-3">
            <Badge variant="outline" className="text-xs">
              {proposal.blast_radius}
            </Badge>
            <div className={`text-xs font-medium ${confidenceDisplay.color}`}>
              {confidenceDisplay.text}
            </div>
            {hasCriticalWarnings && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Warning Summary (Critical Only) */}
        {hasCriticalWarnings && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Critical issues detected - review required
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {new Date(proposal.created_at).toLocaleDateString()}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onReview(proposal.id)}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              Review
            </Button>
            
            {priority === 'ready' && onQuickApprove && (
              <Button
                onClick={() => onQuickApprove(proposal.id)}
                size="sm"
                className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}