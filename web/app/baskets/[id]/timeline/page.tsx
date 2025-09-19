"use client";

import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';
import KnowledgeTimeline from '@/components/timeline/KnowledgeTimeline';
import { useState } from 'react';

/**
 * Clean Timeline Page - Canon v3.0
 * 
 * Shows knowledge evolution story for the basket
 * User-meaningful milestones only, not technical processing details
 */

export default function TimelinePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [significance, setSignificance] = useState<'low' | 'medium' | 'high' | undefined>();

  const filterComponent = (
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
  );

  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <SubpageHeader 
            title="Timeline" 
            basketId={id}
            description="Your knowledge evolution story - see how your understanding has grown over time"
            rightContent={filterComponent}
          />
        </div>
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
