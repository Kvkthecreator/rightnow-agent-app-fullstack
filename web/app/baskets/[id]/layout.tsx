import { BasketProvider } from "@/lib/context/BasketContext";
import Shell from "@/components/layout/Shell";

export default async function BasketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell>
      <BasketProvider initialBasketId={id}>{children}</BasketProvider>
    </Shell>
  );
}
