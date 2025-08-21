import { SubpageHeader } from '@/components/basket/SubpageHeader';

export default function TimelinePage({ params }: { params: { id: string }}) {
  return (
    <div className="p-4">
      <SubpageHeader title="Timeline" basketId={params.id} />
      <div className="text-sm text-muted-foreground">Your timeline will appear here as you add memories.</div>
    </div>
  );
}
