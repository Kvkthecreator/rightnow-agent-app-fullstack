import DocsList from "@/components/basket/DocsList";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: PageProps) {
  const { id } = await params;
  const res = await fetch(`/api/baskets/${id}/documents`, { cache: "no-store" });
  const docs = await res.json();
  return <DocsList items={docs.items || []} />;
}
