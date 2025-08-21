import { SubpageHeader } from "@/components/basket/SubpageHeader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReflectionsPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-4">
      <SubpageHeader title="Reflections" basketId={id} />
      <div className="text-sm text-muted-foreground">Reflections will appear after activity.</div>
    </div>
  );
}
