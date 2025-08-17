interface PageProps {
  params: { id: string; docId: string };
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const res = await fetch(`/api/documents/${params.docId}`, { cache: "no-store" });
  const doc = await res.json();
  return (
    <article className="prose p-4">
      <h2>{doc.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: doc.content_rendered }} />
    </article>
  );
}
