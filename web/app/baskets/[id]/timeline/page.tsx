import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { RequestBoundary } from '@/components/RequestBoundary';

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequestBoundary>
      <div className="p-4">
        <SubpageHeader title="Timeline" basketId={id} />
        <div className="text-sm text-muted-foreground">
          Your timeline will appear here as you add memories.
        </div>
      </div>
    </RequestBoundary>
  );
}
