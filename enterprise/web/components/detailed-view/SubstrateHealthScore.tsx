"use client";

import React from 'react';
import { Heart, Sprout, TreePine, Sparkles } from 'lucide-react';

interface SubstrateHealthScoreProps {
  score: number;
  totalWords: number;
  documentCount: number;
}

export function SubstrateHealthScore({ score, totalWords, documentCount }: SubstrateHealthScoreProps) {
  const getHealthLevel = () => {
    if (score <= 30) return {
      label: 'Just Getting Started',
      message: 'Every substrate begins here - this is exciting!',
      icon: Sprout,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
    if (score <= 60) return {
      label: 'Building Context',
      message: 'Your substrate is growing - patterns are beginning to emerge',
      icon: TreePine,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    };
    if (score <= 80) return {
      label: 'Developing Understanding',
      message: 'Strong substrate emerging - meaningful insights are forming',
      icon: Heart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    };
    return {
      label: 'Rich Substrate',
      message: 'Excellent foundation - deep insights and connections available',
      icon: Sparkles,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    };
  };

  const health = getHealthLevel();
  const IconComponent = health.icon;

  const getContextDescription = () => {
    if (totalWords === 0) return "Your substrate is ready for its first content";
    if (totalWords < 500) return "Early stage - building foundation";
    if (totalWords < 2000) return "Building stage - context developing";
    return `Established - ${totalWords.toLocaleString()} words analyzed`;
  };

  return (
    <div className={`rounded-xl border-2 ${health.borderColor} ${health.bgColor} p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${health.bgColor} border ${health.borderColor}`}>
            <IconComponent className={`h-8 w-8 ${health.color}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${health.color}`}>
              {health.label}
            </h2>
            <p className="text-gray-700 mt-1 max-w-md">
              {health.message}
            </p>
            <div className="mt-2 text-sm text-gray-600">
              {getContextDescription()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${health.color}`}>
            {score}
          </div>
          <div className="text-sm text-gray-600">Health Score</div>
        </div>
      </div>
    </div>
  );
}