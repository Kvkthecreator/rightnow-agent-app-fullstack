import type { Metadata } from 'next';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';
import dynamic from 'next/dynamic';

const CanonicalBlocksClient = dynamic(() => import('./CanonicalBlocksClient'), {
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
    title: `Substrate Blocks - Basket ${id}`,
    description: 'P1 Substrate Agent created blocks - structured content from your memory',
  };
}

export default async function BlocksPage({ params }: PageProps) {
  const { id: basketId } = await params;
  
  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <SubpageHeader 
            title="Substrate Blocks" 
            basketId={basketId}
            description="P1 Agent structured content - watch your thoughts become organized building blocks"
          />
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-6xl">
            {/* P1 Substrate Agent Overview Banner */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    P1 Substrate Agent
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Transforming raw memory into structured, semantic blocks with confidence scoring and context tagging
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Agent-Created</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Semantic Types</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>Context Tagged</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <CanonicalBlocksClient basketId={basketId} />
            </div>
          </div>
        </div>
      </div>
    </RequestBoundary>
  );
}
