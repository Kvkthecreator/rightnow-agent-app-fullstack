import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';
import UnifiedTimeline from '@/components/timeline/UnifiedTimeline';

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequestBoundary>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <SubpageHeader title="Timeline" basketId={id} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <UnifiedTimeline basketId={id} className="max-w-2xl mx-auto" />
        </div>
      </div>
    </RequestBoundary>
  );
}
