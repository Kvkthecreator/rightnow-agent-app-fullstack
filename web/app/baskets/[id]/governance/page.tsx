import type { Metadata } from 'next';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';
import dynamic from 'next/dynamic';

const GovernanceClient = dynamic(() => import('./GovernanceClient'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
    </div>
  ),
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Change Requests - Basket ${id}`,
    description: 'Review and approve substrate change proposals',
  };
}

export default async function GovernancePage({ params }: PageProps) {
  const { id: basketId } = await params;
  
  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <GovernanceClient basketId={basketId} />
        </div>
      </div>
    </RequestBoundary>
  );
}