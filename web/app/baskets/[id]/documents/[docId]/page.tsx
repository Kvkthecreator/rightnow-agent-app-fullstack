import { getServerUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string; docId: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { docId } = await params;
  const baseUrl = getServerUrl();
  const res = await fetch(`${baseUrl}/api/documents/${docId}`, { cache: "no-store" });
  const doc = await res.json();
  return (
    <article className="prose p-4">
      <h2>{doc.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: doc.content_rendered }} />
    </article>
  );
}
