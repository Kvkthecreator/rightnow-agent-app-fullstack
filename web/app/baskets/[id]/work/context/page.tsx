import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import ContextCenter from '@/components/features/basket/centers/ContextCenter';

export default async function ContextPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <BasketWorkLayout
      left={<WorkLeft basketId={id} />}
      center={<ContextCenter basketId={id} />}
      right={<WorkRight basketId={id} />}
    />
  );
}
