import type { Metadata } from 'next';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';
import dynamic from 'next/dynamic';

const BuildingBlocksClient = dynamic(() => import('./BuildingBlocksClient'), {
  loading: () => (
    <div className="space-y-4">
      <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
      <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
    </div>
  ),
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Building Blocks - Basket ${id}`,
    description: 'All substrate types - Canon compliant unified view of your memory building blocks',
  };
}

export default async function BuildingBlocksPage({ params }: PageProps) {
  const { id: basketId } = await params;
  
  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <SubpageHeader 
            title="Building Blocks" 
            basketId={basketId}
            description="All substrate types unified - Canon v1.4.0 compliant view where all substrates are peers"
          />
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-6xl">
            {/* Canon v1.4.0: All Substrates are Peers Banner */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Building Blocks: All Substrate Types
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Canon compliant unified view - Raw captures, context items, and processed blocks as equals
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>P0 Captures</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Context Items</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>P1 Blocks</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <BuildingBlocksClient basketId={basketId} />
            </div>
          </div>
        </div>
      </div>
    </RequestBoundary>
  );
}
