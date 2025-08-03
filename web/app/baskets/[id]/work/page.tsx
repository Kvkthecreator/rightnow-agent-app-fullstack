import { ConsciousnessDashboard } from "@/components/dashboard/ConsciousnessDashboard";
import { getBasketData } from "@/lib/data/basketData";
import { notFound } from "next/navigation";

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const basketData = await getBasketData(id);
  
  if (!basketData) {
    notFound();
  }

  return (
    <ConsciousnessDashboard basketId={id} />
  );
}
