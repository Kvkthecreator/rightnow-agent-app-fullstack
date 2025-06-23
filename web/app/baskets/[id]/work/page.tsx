// web/app/baskets/[id]/work/page.tsx
import { getSnapshot } from "@/lib/baskets/getSnapshot";
import BasketWorkClient from "./BasketWorkClient";

// Match Next 15's PageProps expectation: `params` is a Promise.
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BasketWorkPage({ params }: PageProps) {
  // Unwrap the promise that Next hands us
  const { id } = await params;

  // 1st-paint / SEO fetch
  const initialData = await getSnapshot(id);

  return <BasketWorkClient id={id} initialData={initialData} />;
}
