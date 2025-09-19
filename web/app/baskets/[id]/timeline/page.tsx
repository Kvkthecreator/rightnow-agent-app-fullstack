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

const MemoryChainTimeline = dynamic(() => import('@/components/timeline/MemoryChainTimeline'), {
  loading: () => <div className="h-48 animate-pulse" />,
});

const ProcessingStoryTimeline = dynamic(() => import('@/components/timeline/ProcessingStoryTimeline'), {
  loading: () => <div className="h-48 animate-pulse" />,
});

export default function TimelinePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'stories' | 'chains' | 'events'>('stories');
  
  // Phase 2: Adapter Layer Feature Flag
  const useAdapterTimeline = process.env.NEXT_PUBLIC_ENABLE_ADAPTER_TIMELINE === 'true';

  const filterComponent = (
    <div className="flex items-center gap-4">
      {/* View Mode Toggle */}
      <label className="text-sm font-medium text-gray-700">
        View:
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'stories' | 'chains' | 'events')}
          className="ml-2 border border-gray-300 rounded px-3 py-1"
        >
          <option value="stories">Processing Stories</option>
          <option value="chains">Memory Chains</option>
          <option value="events">Event Log</option>
        </select>
      </label>
      
      {/* Pipeline Filter (only for events view) */}
      {viewMode === 'events' && (
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
      )}
    </div>
  );

  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <SubpageHeader 
            title={
              viewMode === 'stories' ? "Processing Stories" :
              viewMode === 'chains' ? "Memory Chains" : 
              "Event Timeline"
            } 
            basketId={id}
            description={
              viewMode === 'stories' ? "See what's happening with your knowledge - from upload to insights" :
              viewMode === 'chains' ? "Watch your memories transform through agent intelligence" :
              "Detailed event log of agent processing pipeline"
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
              <div className="p-6">
                {viewMode === 'stories' ? (
                  // Processing Stories - user-friendly stories showing cause and effect
                  <ProcessingStoryTimeline basketId={id} />
                ) : viewMode === 'chains' ? (
                  // Memory Chain View - shows processing chains and outcomes
                  <MemoryChainTimeline basketId={id} />
                ) : (
                  // Event Log View - flat timeline with filters
                  <UnifiedTimeline 
                    basketId={id} 
                    className="bg-white rounded-lg shadow-sm" 
                    pipelineFilter={pipelineFilter}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RequestBoundary>
  );
}
