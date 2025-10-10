import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { notFound } from 'next/navigation';
import { loadDoc, listDocs } from '@/lib/docs/loadMarkdown';

interface DocsPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return listDocs().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug } = params;
  const doc = await loadDoc(slug);
  if (!doc) return {};
  return {
    title: `${doc.title} | Yarnnn Docs`,
    description: doc.description,
  };
}

export default async function DocPage({ params }: DocsPageProps) {
  const { slug } = params;
  const doc = await loadDoc(slug);

  if (!doc) {
    notFound();
  }

  const { content } = await compileMDX({
    source: doc.content,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <article className="prose prose-slate dark:prose-invert">{content}</article>
    </main>
  );
}
