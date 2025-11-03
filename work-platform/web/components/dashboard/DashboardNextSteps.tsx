"use client";

import React from 'react';
import { ArrowRight, Plus, FileText, Sparkles } from 'lucide-react';

interface DashboardNextStepsProps {
  documentCount: number;
  totalWords: number;
  hasProcessingQueue: boolean;
  hasInsights: boolean;
  basketId: string;
  onBeginAction: (action: string) => void;
}

export function DashboardNextSteps({ 
  documentCount, 
  totalWords, 
  hasProcessingQueue, 
  hasInsights,
  basketId,
  onBeginAction
}: DashboardNextStepsProps) {
  const generateHonestSteps = () => {
    // Empty substrate
    if (documentCount === 0 && totalWords === 0) {
      return [{
        action: 'add-first-document',
        title: 'Start with your first document',
        description: 'Upload a document or paste content to begin building your research substrate.',
        priority: 'critical' as const
      }];
    }

    const steps = [];

    // Low content - focus on building
    if (totalWords < 500) {
      steps.push({
        action: 'build-substrate',
        title: 'Add strategic content to strengthen patterns',
        description: 'Your substrate needs more foundational material to reveal meaningful insights.',
        priority: 'critical' as const
      });
    }

    // Processing queue exists
    if (hasProcessingQueue) {
      steps.push({
        action: 'process-content',
        title: 'Process pending content',
        description: 'Complete analysis of uploaded materials to unlock new understanding.',
        priority: 'helpful' as const
      });
    }

    // Building stage - balance content
    if (totalWords >= 500 && totalWords < 2000) {
      steps.push({
        action: 'diversify-content',
        title: 'Balance substrate with diverse perspectives',
        description: 'Add different types of content to enrich your research foundation.',
        priority: 'helpful' as const
      });
    }

    // Has insights to review
    if (hasInsights) {
      steps.push({
        action: 'review-insights',
        title: 'Review available insights',
        description: 'Explore the patterns and connections I\'ve discovered in your research.',
        priority: 'helpful' as const
      });
    }

    // Rich substrate - generate more insights
    if (totalWords >= 2000 && !hasInsights) {
      steps.push({
        action: 'generate-insights',
        title: 'Generate insights from your rich substrate',
        description: 'Unlock deeper patterns and connections from your comprehensive research base.',
        priority: 'helpful' as const
      });
    }

    // Default if no specific steps
    if (steps.length === 0) {
      steps.push({
        action: 'explore-patterns',
        title: 'Explore emerging patterns',
        description: 'Let me help you discover what your research is revealing.',
        priority: 'helpful' as const
      });
    }

    // Return max 3 steps
    return steps.slice(0, 3);
  };

  const steps = generateHonestSteps();

  const getStepIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <Plus className="h-4 w-4" />;
      case 'helpful': return <Sparkles className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  const getStepStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          button: 'bg-orange-600 hover:bg-orange-700 text-white',
          border: 'border-orange-200',
          bg: 'bg-orange-50'
        };
      case 'helpful':
        return {
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          border: 'border-blue-200',
          bg: 'bg-blue-50'
        };
      default:
        return {
          button: 'bg-gray-600 hover:bg-gray-700 text-white',
          border: 'border-gray-200',
          bg: 'bg-gray-50'
        };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <ArrowRight className="h-5 w-5 text-gray-600" />
          What You Could Do Next
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Actionable steps to develop your substrate
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const styles = getStepStyles(step.priority);
          
          return (
            <div 
              key={step.action}
              className={`p-4 rounded-lg border ${styles.border} ${styles.bg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {step.description}
                  </p>
                </div>
                <button
                  onClick={() => onBeginAction(step.action)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${styles.button}`}
                >
                  {getStepIcon(step.priority)}
                  Begin
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {steps.length === 1 && steps[0].priority === 'critical' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            Once you complete this step, new possibilities will unlock.
          </p>
        </div>
      )}
    </div>
  );
}