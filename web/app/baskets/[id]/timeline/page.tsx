import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';
import dynamic from 'next/dynamic';

const UnifiedTimeline = dynamic(() => import('@/components/timeline/UnifiedTimeline'), {
  loading: () => <div className="h-48 animate-pulse" />,
});

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <SubpageHeader title="Timeline" basketId={id} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <UnifiedTimeline basketId={id} className="mx-auto max-w-2xl" />
        </div>
      </div>
    </RequestBoundary>
  );
}
