import { BasketProvider } from "@/lib/context/BasketContext";

export default async function BasketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { id } = params as { id: string };
  return <BasketProvider initialBasketId={id}>{children}</BasketProvider>;
}
