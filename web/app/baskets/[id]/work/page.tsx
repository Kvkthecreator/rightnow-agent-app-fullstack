import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import DashboardCenter from '@/components/features/basket/centers/DashboardCenter';

export default async function BasketWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <BasketWorkLayout
      left={<WorkLeft basketId={id} />}
      center={<DashboardCenter basketId={id} />}
      right={<WorkRight basketId={id} />}
    />
  );
}
