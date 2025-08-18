import StateSnapshot from "@/components/basket/StateSnapshot";
import DocsList from "@/components/basket/DocsList";
import NextMove from "@/components/basket/NextMove";
import { getServerUrl } from "@/lib/utils";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { id } = await params;
  const baseUrl = getServerUrl();
  const [stateRes, docsRes, proposalsRes] = await Promise.all([
    fetch(`${baseUrl}/api/baskets/${id}/state`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/baskets/${id}/documents?limit=3`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/baskets/${id}/proposals`, { cache: "no-store" }),
  ]);

  if (!stateRes.ok) {
    notFound();
  }

  const state = await stateRes.json();
  const docs = docsRes.ok ? await docsRes.json() : { items: [] };
  const proposals = proposalsRes.ok ? await proposalsRes.json() : { items: [] };

  return (
    <div className="space-y-6">
      <StateSnapshot state={state} />
      <DocsList items={docs.items || []} />
      <NextMove items={proposals.items || []} />
    </div>
  );
}
