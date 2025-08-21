import { SubpageHeader } from "@/components/basket/SubpageHeader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HistoryPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-4">
      <SubpageHeader title="History" basketId={id} />
      <div className="text-sm text-muted-foreground">No history yet.</div>
    </div>
  );
}
