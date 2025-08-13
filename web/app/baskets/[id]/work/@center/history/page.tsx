import HistoryCenter from '@/components/features/basket/centers/HistoryCenter';
import CenterBoundary from '@/components/common/CenterBoundary';

interface HistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { id } = await params;
  return (
    <CenterBoundary skeletonType="history">
      <HistoryCenter basketId={id} />
    </CenterBoundary>
  );
}