import InsightsCenter from '@/components/features/basket/centers/InsightsCenter';
import CenterBoundary from '@/components/common/CenterBoundary';

interface InsightsPageProps {
  params: Promise<{ id: string }>;
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  const { id } = await params;
  return (
    <CenterBoundary skeletonType="insights">
      <InsightsCenter basketId={id} />
    </CenterBoundary>
  );
}