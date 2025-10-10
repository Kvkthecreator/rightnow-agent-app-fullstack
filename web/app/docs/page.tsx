import Link from 'next/link';
import { listDocs } from '@/lib/docs/loadMarkdown';

export const metadata = {
  title: 'Yarnnn Documentation',
  description: 'Guides for connecting Claude and ChatGPT to Yarnnn.',
};

export default function DocsHome() {
  const docs = listDocs();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Yarnnn Documentation</h1>
        <p className="text-muted-foreground">
          Connect Yarnnn to your AI hosts and manage ambient context.
        </p>
      </section>
      <section className="mt-10 grid gap-6">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/docs/integrations/${doc.slug}`}
            className="block rounded-lg border border-border p-6 transition hover:border-primary"
          >
            <h2 className="text-xl font-medium">{doc.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{doc.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
