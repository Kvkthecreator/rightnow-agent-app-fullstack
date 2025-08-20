/**
 * Redirect: /baskets/[id] -> /baskets/[id]/memory
 * Status: 302 Temporary Redirect (memory is primary operating surface)
 */
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BasketPage({ params }: Props) {
  const { id } = await params;
  redirect(`/baskets/${id}/memory`);
}
