import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import DocumentDetailCenter from '@/components/features/basket/centers/DocumentDetailCenter';
import { FocusProvider } from '@/components/features/basket/FocusContext';

interface DocumentDetailPageProps {
  params: Promise<{ id: string; docId: string }>;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id, docId } = await params;
  return (
    <FocusProvider>
      <BasketWorkLayout
        left={<WorkLeft basketId={id} />}
        center={<DocumentDetailCenter basketId={id} docId={docId} />}
        right={<WorkRight basketId={id} />}
      />
    </FocusProvider>
  );
}
