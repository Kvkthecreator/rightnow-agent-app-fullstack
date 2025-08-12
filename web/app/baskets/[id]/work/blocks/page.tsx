import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import BlocksCenter from '@/components/features/basket/centers/BlocksCenter';

interface BlocksPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlocksPage({ params }: BlocksPageProps) {
  const { id } = await params;
  return (
    <BasketWorkLayout
      left={<WorkLeft basketId={id} />}
      center={<BlocksCenter basketId={id} />}
      right={<WorkRight basketId={id} />}
    />
  );
}
