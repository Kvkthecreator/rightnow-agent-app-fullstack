"use client";

import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';
import KnowledgeTimeline from '@/components/timeline/KnowledgeTimeline';
import { useState } from 'react';
import { Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Canon-Compliant Timeline Page
 * 
 * Sacred Principle: "Narrative is Deliberate" - Shows knowledge evolution story
 * Focus on meaningful milestones in knowledge development, not technical processing
 * Transform timeline_events into user-friendly knowledge journey narrative
 */

export default function TimelinePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [significance, setSignificance] = useState<'low' | 'medium' | 'high' | undefined>();

  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Evolution</h1>
              <p className="text-gray-600">Track the story of how your understanding has grown over time</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Show:
                <select
                  value={significance || 'all'}
                  onChange={(e) => setSignificance(e.target.value === 'all' ? undefined : e.target.value as 'low' | 'medium' | 'high')}
                  className="ml-2 border border-gray-300 rounded px-3 py-1"
                >
                  <option value="all">All Milestones</option>
                  <option value="high">Major Milestones</option>
                  <option value="medium">Notable Events</option>
                  <option value="low">All Activity</option>
                </select>
              </label>
            </div>
          </div>
        </div>
        
        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-4xl p-6">
            <KnowledgeTimeline 
              basketId={id} 
              significance={significance}
              className="bg-white rounded-lg shadow-sm p-6" 
            />
          </div>
        </div>
      </div>
    </RequestBoundary>
  );
}
