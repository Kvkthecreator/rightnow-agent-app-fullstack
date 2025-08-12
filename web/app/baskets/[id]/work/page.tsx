import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import DashboardCenter from '@/components/features/basket/centers/DashboardCenter';
import { FocusProvider } from '@/components/features/basket/FocusContext';

interface BasketWorkPageProps {
  params: Promise<{ id: string }>;
}

export default async function BasketWorkPage({ params }: BasketWorkPageProps) {
  const { id } = await params;
  return (
    <FocusProvider>
      <BasketWorkLayout
        left={<WorkLeft basketId={id} />}
        center={<DashboardCenter basketId={id} />}
        right={<WorkRight basketId={id} />}
      />
    </FocusProvider>
  );
}
