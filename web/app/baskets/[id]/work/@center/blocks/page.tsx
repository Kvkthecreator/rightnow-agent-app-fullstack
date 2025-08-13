import BlocksCenter from '@/components/features/basket/centers/BlocksCenter';
import CenterBoundary from '@/components/common/CenterBoundary';

interface BlocksPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlocksPage({ params }: BlocksPageProps) {
  const { id } = await params;
  return (
    <CenterBoundary skeletonType="blocks">
      <BlocksCenter basketId={id} />
    </CenterBoundary>
  );
}
