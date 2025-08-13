import DocumentsCenter from '@/components/features/basket/centers/DocumentsCenter';
import CenterBoundary from '@/components/common/CenterBoundary';

interface DocumentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { id } = await params;
  return (
    <CenterBoundary skeletonType="documents">
      <DocumentsCenter basketId={id} />
    </CenterBoundary>
  );
}
