import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import DocumentsCenter from '@/components/features/basket/centers/DocumentsCenter';
import { FocusProvider } from '@/components/features/basket/FocusContext';

interface DocumentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { id } = await params;
  return (
    <FocusProvider>
      <BasketWorkLayout
        left={<WorkLeft basketId={id} />}
        center={<DocumentsCenter basketId={id} />}
        right={<WorkRight basketId={id} />}
      />
    </FocusProvider>
  );
}
