import { BasketProvider } from "@/lib/context/BasketContext";
import Shell from "@/components/layouts/Shell";

export default async function BasketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <BasketProvider initialId={id}>
      <Shell>{children}</Shell>
    </BasketProvider>
  );
}
