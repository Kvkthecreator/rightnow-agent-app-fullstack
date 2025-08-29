import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';
import dynamic from 'next/dynamic';

const UnifiedTimeline = dynamic(() => import('@/components/timeline/UnifiedTimeline'), {
  loading: () => <div className="h-48 animate-pulse" />,
});

const ConsumerTimeline = dynamic(() => import('@/components/timeline/ConsumerTimeline').then(mod => ({ default: mod.ConsumerTimeline })), {
  loading: () => <div className="h-48 animate-pulse" />,
});

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Phase 2: Adapter Layer Feature Flag
  const useAdapterTimeline = process.env.NEXT_PUBLIC_ENABLE_ADAPTER_TIMELINE === 'true';

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
              <>
                {/* Pipeline Overview Banner */}
                <div className="bg-white border-b px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Canonical Agent Processing</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Watch as P0→P1→P2→P3 agents transform your input into structured knowledge
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>P0 Capture</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>P1 Substrate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                        <span>P2 Graph</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>P3 Reflection</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <UnifiedTimeline basketId={id} className="bg-white rounded-lg shadow-sm" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </RequestBoundary>
  );
}
