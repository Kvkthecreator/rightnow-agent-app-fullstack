import InsightsCenter from '@/components/features/basket/centers/InsightsCenter';

interface InsightsPageProps {
  params: Promise<{ id: string }>;
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  const { id } = await params;
  return <InsightsCenter basketId={id} />;
}