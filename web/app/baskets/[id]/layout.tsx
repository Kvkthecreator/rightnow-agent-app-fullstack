import { BasketProvider } from "@/lib/context/BasketContext";

export default async function BasketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const { id } = params;
  return <BasketProvider initialBasketId={id}>{children}</BasketProvider>;
}
