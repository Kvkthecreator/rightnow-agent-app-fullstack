// web/app/baskets/[id]/work/page.tsx
import { getSnapshot } from "@/lib/baskets/getSnapshot";
import BasketWorkClient from "./BasketWorkClient";

/**
 *   In Next 15 the framework’s internal `PageProps` allows `params`
 *   to arrive either as a plain object *or* an async wrapper.
 *   Accept both, normalise with Promise.resolve, and move on.
 */
type Params = { id: string } | Promise<{ id: string }>;

export default async function BasketWorkPage({
  params,
}: {
  params: Params;
}) {
  // ── normalise params so we always have a simple `{ id }`
  const { id } = await Promise.resolve(params);

  // one server-side fetch for fast first paint / SEO
  const initialData = await getSnapshot(id);

  return <BasketWorkClient id={id} initialData={initialData} />;
}
