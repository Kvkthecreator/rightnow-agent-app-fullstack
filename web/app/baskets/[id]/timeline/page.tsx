interface PageProps {
  params: { id: string };
}

export default async function TimelinePage({ params }: PageProps) {
  const res = await fetch(`/api/baskets/${params.id}/timeline`, { cache: "no-store" });
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
