import BasketWorkLayout from '@/components/layouts/BasketWorkLayout';
import WorkLeft from '@/components/features/basket/WorkLeft';
import WorkRight from '@/components/features/basket/WorkRight';
import { FocusProvider } from '@/components/features/basket/FocusContext';

interface LayoutProps {
  children: React.ReactNode;
  center: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function WorkLayout({ children, center, params }: LayoutProps) {
  const { id } = await params;
  
  return (
    <FocusProvider>
      <BasketWorkLayout
        left={<WorkLeft basketId={id} />}
        center={center}
        right={<WorkRight basketId={id} />}
      />
    </FocusProvider>
  );
}

export const dynamic = "force-dynamic";