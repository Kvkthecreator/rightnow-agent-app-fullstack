/**
 * Redirect: /baskets/[id]/dashboard -> /baskets/[id]/memory
 * Status: 301 Permanent Redirect (dashboard migrated to memory)
 */
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/baskets/${id}/memory`);
}