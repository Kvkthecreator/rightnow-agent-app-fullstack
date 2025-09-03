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
    description: 'Your knowledge organized into searchable, editable building blocks',
  };
}

export default async function BuildingBlocksPage({ params }: PageProps) {
  const { id: basketId } = await params;
  
  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-100 p-3">
          <SubpageHeader 
            title="Building Blocks" 
            basketId={basketId}
            description="Your knowledge organized into searchable, editable pieces"
          />
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-6xl">
            <div className="p-4">
              <BuildingBlocksClient basketId={basketId} />
            </div>
          </div>
        </div>
      </div>
    </RequestBoundary>
  );
}
