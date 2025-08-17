interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TimelinePage({ params }: PageProps) {
  const { id } = await params;
  const res = await fetch(`/api/baskets/${id}/timeline`, { cache: "no-store" });
  const data = await res.json();
  const items = data.items || [];
  return (
    <ul className="space-y-2">
      {items.map((item: any, idx: number) => (
        <li key={idx} className="rounded border p-2">
          {item.summary}
        </li>
      ))}
    </ul>
  );
}
