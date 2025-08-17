interface PageProps {
  params: { id: string };
}

export default async function BlocksPage({ params }: PageProps) {
  const res = await fetch(`/api/baskets/${params.id}/blocks`, { cache: "no-store" });
  const data = await res.json();
  const items = data.items || [];
  return (
    <ul className="space-y-2">
      {items.map((block: any) => (
        <li key={block.id} className="rounded border p-2">
          {block.title}
        </li>
      ))}
    </ul>
  );
}
