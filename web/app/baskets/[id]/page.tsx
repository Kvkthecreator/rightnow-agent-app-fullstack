import { redirect } from "next/navigation";

interface Props {
  params: { id: string };
}

export default function BasketPage({ params }: Props) {
  redirect(`/baskets/${params.id}/dashboard`);
}
