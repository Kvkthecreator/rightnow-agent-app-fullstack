import BlocksCenter from '@/components/features/basket/centers/BlocksCenter';

interface BlocksPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlocksPage({ params }: BlocksPageProps) {
  const { id } = await params;
  return <BlocksCenter basketId={id} />;
}
