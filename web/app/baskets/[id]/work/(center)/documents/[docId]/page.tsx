import DocumentDetailCenter from '@/components/features/basket/centers/DocumentDetailCenter';

interface DocumentDetailPageProps {
  params: Promise<{ id: string; docId: string }>;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id, docId } = await params;
  return <DocumentDetailCenter basketId={id} docId={docId} />;
}
