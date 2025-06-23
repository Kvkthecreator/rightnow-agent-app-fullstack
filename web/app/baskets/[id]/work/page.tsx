import { getSnapshot } from "@/lib/baskets/getSnapshot";
import BasketWorkClient from "./BasketWorkClient";

export default async function BasketWorkPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // Fetch once on the server for fast first paint / SEO
  const initialData = await getSnapshot(id);

  return (
    <BasketWorkClient id={id} initialData={initialData} />
  );
}
