import { BasketProvider } from "@/lib/context/BasketContext";

export default async function BasketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <BasketProvider initialId={id}>{children}</BasketProvider>
  );
}
