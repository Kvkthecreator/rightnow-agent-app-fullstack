import DashboardCenter from '@/components/features/basket/centers/DashboardCenter';

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  return <DashboardCenter basketId={id} />;
}