"use client";

import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const UnifiedTimeline = dynamic(() => import('@/components/timeline/UnifiedTimeline'), {
  loading: () => <div className="h-48 animate-pulse" />,
});

const ConsumerTimeline = dynamic(() => import('@/components/timeline/ConsumerTimeline').then(mod => ({ default: mod.ConsumerTimeline })), {
  loading: () => <div className="h-48 animate-pulse" />,
});

export default function TimelinePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  
  // Phase 2: Adapter Layer Feature Flag
  const useAdapterTimeline = process.env.NEXT_PUBLIC_ENABLE_ADAPTER_TIMELINE === 'true';

  const filterComponent = (
    <label className="text-sm font-medium text-gray-700">
      Filter:
      <select
        value={pipelineFilter}
        onChange={(e) => setPipelineFilter(e.target.value)}
        className="ml-2 border border-gray-300 rounded px-3 py-1"
      >
        <option value="all">All Events</option>
        <option value="P0_CAPTURE">P0 Capture</option>
        <option value="P1_SUBSTRATE">P1 Substrate</option>
        <option value="P2_GRAPH">P2 Graph</option>
        <option value="P3_REFLECTION">P3 Reflection</option>
        <option value="P4_PRESENTATION">P4 Presentation</option>
        <option value="QUEUE">Queue Processing</option>
      </select>
    </label>
  );

  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <SubpageHeader 
            title={useAdapterTimeline ? "Your Timeline" : "Timeline"} 
            basketId={id}
            description={useAdapterTimeline ? 
              "Your personal memory timeline - AI agents processing your thoughts" :
              "Agent processing timeline - watch your thoughts become structured intelligence"
            }
            rightContent={filterComponent}
          />
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-4xl">
            {useAdapterTimeline ? (
              // Phase 2: Consumer Adapter Timeline
              <div className="p-6">
                <ConsumerTimeline basketId={id} />
              </div>
            ) : (
              // Phase 1: Canonical Timeline
              <div className="p-6">
                <UnifiedTimeline 
                  basketId={id} 
                  className="bg-white rounded-lg shadow-sm" 
                  pipelineFilter={pipelineFilter}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </RequestBoundary>
  );
}
