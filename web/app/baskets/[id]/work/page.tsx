// app/baskets/[id]/work/page.tsx
import { getSnapshot } from "@/lib/baskets/getSnapshot";
import BasketWorkClient from "./BasketWorkClient";

export default async function BasketWorkPage({
  params,
}: {
  params: { id: string };
}) {
  const initialData = await getSnapshot(params.id);
  return <BasketWorkClient id={params.id} initialData={initialData} />;
}
