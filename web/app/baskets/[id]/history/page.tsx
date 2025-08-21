/**
 * Redirect: /baskets/[id]/history -> /baskets/[id]/timeline
 * Status: 301 Permanent Redirect (history renamed to timeline)
 */
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HistoryRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/baskets/${id}/timeline`);
}