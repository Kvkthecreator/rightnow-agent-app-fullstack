import { SubpageHeader } from "@/components/basket/SubpageHeader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GraphPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-4">
      <SubpageHeader title="Graph" basketId={id} />
      <div className="text-sm text-muted-foreground">
        The graph will appear as your Memory grows.
      </div>
    </div>
  );
}
