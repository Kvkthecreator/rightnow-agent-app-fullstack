import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import HistoryCenter from '@/components/features/basket/centers/HistoryCenter';
import { FocusProvider } from '@/components/features/basket/FocusContext';

interface HistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { id } = await params;
  return (
    <FocusProvider>
      <BasketWorkLayout
        left={<WorkLeft basketId={id} />}
        center={<HistoryCenter basketId={id} />}
        right={<WorkRight basketId={id} />}
      />
    </FocusProvider>
  );
}
