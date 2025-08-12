import ContextCenter from '@/components/features/basket/centers/ContextCenter';

interface ContextPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContextPage({ params }: ContextPageProps) {
  const { id } = await params;
  return <ContextCenter basketId={id} />;
}
