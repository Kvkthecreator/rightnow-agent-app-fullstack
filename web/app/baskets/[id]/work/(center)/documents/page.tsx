import DocumentsCenter from '@/components/features/basket/centers/DocumentsCenter';

interface DocumentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { id } = await params;
  return <DocumentsCenter basketId={id} />;
}
