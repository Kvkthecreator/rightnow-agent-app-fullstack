import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BasketPage({ params }: Props) {
  const { id } = await params;
  redirect(`/baskets/${id}/dashboard`);
}
