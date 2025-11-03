import React from 'react';
import { ShieldCheck, AlertTriangle, Lightbulb, Check, X } from 'lucide-react';

interface HonestAssessmentProps {
  assessment: {
    contextQuality: number;
    contentSufficiency: 'minimal' | 'moderate' | 'sufficient' | 'rich';
    whatsWorking: string[];
    whatsMissing: string[];
    recommendations: string[];
    thresholds: Array<{
      feature: string;
      current: number;
      required: number;
      unit: string;
    }>;
  };
}

export function HonestAssessmentSection({ assessment }: HonestAssessmentProps) {
  const getSufficiencyColor = (level: string) => {
    switch (level) {
      case 'rich': return 'text-green-700 bg-green-50 border-green-200';
      case 'sufficient': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'moderate': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'minimal': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSufficiencyIcon = (level: string) => {
    switch (level) {
      case 'rich': return '🚀';
      case 'sufficient': return '✅';
      case 'moderate': return '⚠️';
      case 'minimal': return '⛔';
      default: return '❔';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <ShieldCheck className="h-5 w-5 mr-2 text-gray-500" />
          Honest Assessment
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Truthful evaluation without marketing spin
        </p>
      </div>

      {/* Overall Quality Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Real Context Quality</span>
          <span className="text-lg font-bold text-gray-900">
            {Math.round(assessment.contextQuality * 100)}%
          </span>
        </div>
        <div className="bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-500 h-3 rounded-full transition-all duration-700"
            style={{ width: `${assessment.contextQuality * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Based on actual content analysis, not inflated baselines
        </div>
      </div>

      {/* Content Sufficiency */}
      <div className="mb-6">
        <div className={`p-4 rounded-lg border ${getSufficiencyColor(assessment.contentSufficiency)}`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getSufficiencyIcon(assessment.contentSufficiency)}</span>
            <div>
              <div className="font-medium capitalize">{assessment.contentSufficiency} Content</div>
              <div className="text-sm opacity-80">
                {assessment.contentSufficiency === 'rich' && 'Excellent foundation for deep insights'}
                {assessment.contentSufficiency === 'sufficient' && 'Good enough for meaningful analysis'}
                {assessment.contentSufficiency === 'moderate' && 'Basic insights possible, more content needed'}
                {assessment.contentSufficiency === 'minimal' && 'Insufficient for quality intelligence'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Working / What's Missing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Check className="h-4 w-4 mr-2 text-green-500" />
            What's Working
          </h3>
          {assessment.whatsWorking.length > 0 ? (
            <div className="space-y-2">
              {assessment.whatsWorking.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">Nothing significant working yet</div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <X className="h-4 w-4 mr-2 text-red-500" />
            What's Missing
          </h3>
          {assessment.whatsMissing.length > 0 ? (
            <div className="space-y-2">
              {assessment.whatsMissing.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">Everything looks good!</div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
          Actionable Recommendations
        </h3>
        {assessment.recommendations.length > 0 ? (
          <div className="space-y-3">
            {assessment.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <span className="text-lg mr-2">💡</span>
                  <span className="text-sm text-blue-800">{rec}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">No specific recommendations at this time</div>
        )}
      </div>

      {/* Feature Thresholds */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Feature Unlock Thresholds</h3>
        <div className="space-y-3">
          {assessment.thresholds.map((threshold, index) => {
            const progress = Math.min(threshold.current / threshold.required, 1);
            const isUnlocked = threshold.current >= threshold.required;
            
            return (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{threshold.feature}</span>
                  <div className="flex items-center">
                    {isUnlocked ? (
                      <span className="text-green-600 text-sm font-medium flex items-center">
                        <Check className="h-4 w-4 mr-1" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-gray-600 text-sm">
                        {threshold.current}/{threshold.required} {threshold.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isUnlocked ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                {!isUnlocked && (
                  <div className="mt-1 text-xs text-gray-600">
                    Need {threshold.required - threshold.current} more {threshold.unit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}