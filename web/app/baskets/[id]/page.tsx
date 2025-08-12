import DashboardCenter from '@/components/features/basket/centers/DashboardCenter';

export default async function BasketIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DashboardCenter basketId={id} />;
}
