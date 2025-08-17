import DocsList from "@/components/basket/DocsList";
import { getServerUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: PageProps) {
  const { id } = await params;
  const baseUrl = getServerUrl();
  const res = await fetch(`${baseUrl}/api/baskets/${id}/documents`, { cache: "no-store" });
  const docs = await res.json();
  return <DocsList items={docs.items || []} />;
}
