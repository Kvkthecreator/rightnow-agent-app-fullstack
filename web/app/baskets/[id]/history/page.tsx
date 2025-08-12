import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import HistoryCenter from '@/components/features/basket/centers/HistoryCenter';

interface HistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { id } = await params;
  return (
    <BasketWorkLayout
      left={<WorkLeft basketId={id} />}
      center={<HistoryCenter basketId={id} />}
      right={<WorkRight basketId={id} />}
    />
  );
}
