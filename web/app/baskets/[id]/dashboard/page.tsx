import StateSnapshot from "@/components/basket/StateSnapshot";
import DocsList from "@/components/basket/DocsList";
import NextMove from "@/components/basket/NextMove";

interface PageProps {
  params: { id: string };
}

export default async function DashboardPage({ params }: PageProps) {
  const { id } = params;
  const [stateRes, docsRes, proposalsRes] = await Promise.all([
    fetch(`/api/baskets/${id}/state`, { cache: "no-store" }),
    fetch(`/api/baskets/${id}/documents?limit=3`, { cache: "no-store" }),
    fetch(`/api/baskets/${id}/proposals`, { cache: "no-store" }),
  ]);

  const state = await stateRes.json();
  const docs = await docsRes.json();
  const proposals = proposalsRes.ok ? await proposalsRes.json() : { items: [] };

  return (
    <div className="space-y-6">
      <StateSnapshot state={state} />
      <DocsList items={docs.items || []} />
      <NextMove items={proposals.items || []} />
    </div>
  );
}
