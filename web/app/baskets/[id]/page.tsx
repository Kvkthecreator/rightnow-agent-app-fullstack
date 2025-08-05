import { redirect } from "next/navigation";

interface BasketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BasketDetailPage({ params }: BasketDetailPageProps) {
  const { id } = await params;
  
  // Redirect to work interface - this eliminates navigation confusion
  redirect(`/baskets/${id}/work`);
}
