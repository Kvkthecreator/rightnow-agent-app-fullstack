import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import InsightsCenter from '@/components/features/basket/centers/InsightsCenter';

export default async function InsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <BasketWorkLayout
      left={<WorkLeft basketId={id} />}
      center={<InsightsCenter basketId={id} />}
      right={<WorkRight basketId={id} />}
    />
  );
}
