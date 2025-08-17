import DocsList from "@/components/basket/DocsList";

interface PageProps {
  params: { id: string };
}

export default async function DocumentsPage({ params }: PageProps) {
  const res = await fetch(`/api/baskets/${params.id}/documents`, { cache: "no-store" });
  const docs = await res.json();
  return <DocsList items={docs.items || []} />;
}
