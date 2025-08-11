import BasketWorkLayout from "@/components/basket/BasketWorkLayout";

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BasketWorkLayout>{children}</BasketWorkLayout>;
}

