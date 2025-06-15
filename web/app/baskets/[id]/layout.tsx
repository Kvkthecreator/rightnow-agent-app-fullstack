import { BasketProvider } from "@/lib/context/BasketContext";

export default function BasketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const { id } = params;
  return <BasketProvider initialId={id}>{children}</BasketProvider>;
}
