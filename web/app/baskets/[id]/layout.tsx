"use client";
import { BasketProvider } from "@/lib/context/BasketContext";
import Shell from "@/components/layouts/Shell";

export default function BasketLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  return (
    <BasketProvider initialId={params.id}>
      <Shell>{children}</Shell>
    </BasketProvider>
  );
}
