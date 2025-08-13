import ContextCenter from '@/components/features/basket/centers/ContextCenter';
import CenterBoundary from '@/components/common/CenterBoundary';

interface ContextPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContextPage({ params }: ContextPageProps) {
  const { id } = await params;
  return (
    <CenterBoundary skeletonType="context">
      <ContextCenter basketId={id} />
    </CenterBoundary>
  );
}
