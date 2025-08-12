import HistoryCenter from '@/components/features/basket/centers/HistoryCenter';

interface HistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { id } = await params;
  return <HistoryCenter basketId={id} />;
}