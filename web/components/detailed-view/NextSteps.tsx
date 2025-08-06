"use client";

import React from 'react';
import { ArrowRight, Plus, FileText, Zap, CheckCircle } from 'lucide-react';

interface NextStep {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'helpful' | 'optional';
  action?: () => void;
  actionLabel?: string;
}

interface NextStepsProps {
  documentCount: number;
  totalWords: number;
  hasProcessingQueue: boolean;
  hasInsights: boolean;
  basketId: string;
}

export function NextSteps({ 
  documentCount, 
  totalWords, 
  hasProcessingQueue, 
  hasInsights,
  basketId 
}: NextStepsProps) {
  const generateSteps = (): NextStep[] => {
    const steps: NextStep[] = [];

    // Empty substrate
    if (documentCount === 0 && totalWords === 0) {
      steps.push({
        id: 'first-content',
        title: 'Start by adding your first document',
        description: 'Your substrate is ready to grow. Upload a document or paste content to begin building understanding.',
        priority: 'critical',
        actionLabel: 'Add Document',
        action: () => {
          // Navigate to documents page
          if (typeof window !== 'undefined') {
            window.location.href = `/baskets/${basketId}/work/documents/new`;
          }
        }
      });
      return steps;
    }

    // Low context - need more content
    if (totalWords < 500) {
      steps.push({
        id: 'build-context',
        title: 'Add strategic context to strengthen patterns',
        description: 'Your substrate would benefit from more foundational content. Consider adding planning documents, research, or core materials.',
        priority: 'critical',
        actionLabel: 'Add Content',
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.href = `/baskets/${basketId}/work/documents`;
          }
        }
      });
    }

    // Processing queue exists
    if (hasProcessingQueue) {
      steps.push({
        id: 'process-queue',
        title: 'Process pending content',
        description: 'You have content waiting to be processed. This will unlock new insights and patterns.',
        priority: 'helpful',
        actionLabel: 'Process Now'
      });
    }

    // Moderate context - specific improvements
    if (totalWords >= 500 && totalWords < 2000) {
      // Detect what type of content might be missing based on patterns
      steps.push({
        id: 'balance-content',
        title: 'Balance your substrate with diverse content',
        description: 'Consider adding different types of content: strategy documents, user research, technical specs, or meeting notes.',
        priority: 'helpful',
        actionLabel: 'Explore Content Types'
      });
    }

    // Has insights to review
    if (hasInsights) {
      steps.push({
        id: 'review-insights',
        title: 'Review available insights',
        description: 'Your substrate has generated insights that are ready for review. These can help guide your next decisions.',
        priority: 'helpful',
        actionLabel: 'Review Insights',
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.href = `/baskets/${basketId}/work`;
          }
        }
      });
    }

    // Rich substrate - optimization
    if (totalWords >= 2000 && !hasInsights) {
      steps.push({
        id: 'generate-insights',
        title: 'Generate insights from your rich substrate',
        description: 'Your substrate has sufficient content for deep analysis. Generate insights to uncover patterns and connections.',
        priority: 'helpful',
        actionLabel: 'Generate Insights'
      });
    }

    // Maintenance for rich substrates
    if (totalWords >= 2000 && documentCount > 5) {
      steps.push({
        id: 'substrate-health',
        title: 'Maintain substrate health',
        description: 'Consider organizing content, updating outdated information, or exploring cross-connections.',
        priority: 'optional',
        actionLabel: 'Explore Organization'
      });
    }

    // If no specific steps, provide general guidance
    if (steps.length === 0) {
      steps.push({
        id: 'explore-substrate',
        title: 'Explore your substrate\'s potential',
        description: 'Your substrate is healthy. Consider generating insights, adding new perspectives, or exploring connections.',
        priority: 'optional',
        actionLabel: 'Explore Options'
      });
    }

    // Limit to top 3 most impactful steps
    return steps.slice(0, 3);
  };

  const steps = generateSteps();

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: Zap,
          label: 'Critical'
        };
      case 'helpful':
        return {
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: ArrowRight,
          label: 'Helpful'
        };
      case 'optional':
        return {
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: CheckCircle,
          label: 'Optional'
        };
      default:
        return {
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: ArrowRight,
          label: 'Suggested'
        };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <ArrowRight className="h-5 w-5 mr-2 text-gray-500" />
          Next Steps
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Clear actions to develop your substrate further
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const config = getPriorityConfig(step.priority);
          const IconComponent = config.icon;

          return (
            <div 
              key={step.id}
              className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm font-medium ${config.color}`}>
                      {index + 1}.
                    </span>
                    <IconComponent className={`h-4 w-4 ${config.color}`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-medium ${config.color} mb-1`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      {step.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                        {config.label}
                      </span>
                      {step.priority === 'critical' && (
                        <span className="text-xs text-gray-600">
                          • High impact on substrate health
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {step.actionLabel && (
                  <button
                    onClick={step.action}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                      step.priority === 'critical'
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                        : step.priority === 'helpful'
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                        : 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {step.actionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {steps.length === 1 && steps[0].priority === 'critical' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <CheckCircle className="h-4 w-4 inline mr-1" />
            Once you complete this step, new opportunities will become available.
          </p>
        </div>
      )}
    </div>
  );
}