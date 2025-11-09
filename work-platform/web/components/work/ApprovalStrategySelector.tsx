"use client";

import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoIcon } from 'lucide-react';

export interface ApprovalStrategy {
  strategy: "checkpoint_required" | "final_only" | "auto_approve_low_risk";
  description?: string;
}

interface ApprovalStrategySelectorProps {
  strategy: ApprovalStrategy;
  onChange: (strategy: ApprovalStrategy) => void;
  agentType?: string;
}

export default function ApprovalStrategySelector({
  strategy,
  onChange,
  agentType
}: ApprovalStrategySelectorProps) {

  const getRecommendedStrategy = (agentType: string): "checkpoint_required" | "final_only" | "auto_approve_low_risk" => {
    switch (agentType) {
      case 'research':
        return 'checkpoint_required'; // Research benefits from interim validation
      case 'content':
        return 'final_only'; // Content usually reviewed at end
      case 'reporting':
        return 'final_only'; // Reports reviewed at end
      default:
        return 'final_only';
    }
  };

  const getStrategyDescription = (strategyType: string): string => {
    switch (strategyType) {
      case 'checkpoint_required':
        return 'Agent pauses at key decision points for your review before continuing. Best for complex research or multi-step tasks.';
      case 'final_only':
        return 'Agent completes the full task, then presents results for approval. Best for most content and reporting work.';
      case 'auto_approve_low_risk':
        return 'Agent automatically approves straightforward outputs, only requesting review for complex or uncertain deliverables. Fastest option.';
      default:
        return '';
    }
  };

  const isRecommended = agentType && strategy.strategy === getRecommendedStrategy(agentType);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="approval-strategy" className="text-sm font-medium text-slate-800">
          Approval Strategy
        </Label>
        {agentType && (
          <span className="text-xs text-slate-500">
            Recommended for {agentType}: {getRecommendedStrategy(agentType).replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <Select
        value={strategy.strategy}
        onValueChange={(value: "checkpoint_required" | "final_only" | "auto_approve_low_risk") =>
          onChange({
            strategy: value,
            description: getStrategyDescription(value),
          })
        }
      >
        <SelectTrigger id="approval-strategy" className="bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="checkpoint_required">
            Checkpoint Required
            {agentType === 'research' && ' ⭐ (Recommended)'}
          </SelectItem>
          <SelectItem value="final_only">
            Final Only
            {(agentType === 'content' || agentType === 'reporting') && ' ⭐ (Recommended)'}
          </SelectItem>
          <SelectItem value="auto_approve_low_risk">
            Auto-Approve Low Risk
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Strategy Description */}
      <div className="flex items-start gap-2 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-slate-700">
        <InfoIcon className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-medium text-blue-900 mb-1">What this means:</div>
          <p>{getStrategyDescription(strategy.strategy)}</p>
        </div>
      </div>

      {/* Recommendation Notice */}
      {isRecommended && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
          ✓ This is the recommended strategy for {agentType} agents
        </div>
      )}
    </div>
  );
}
