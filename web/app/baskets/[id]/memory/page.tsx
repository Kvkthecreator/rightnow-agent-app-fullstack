/**
 * Page: /baskets/[id]/memory - Primary Operating Surface (Canon v1.3)
 * Data sources:
 *  - GET /api/baskets/:id/projection -> ProjectionDTO
 * @contract renders: ProjectionDTO (Left: Capture, Center: History, Right: Projection)
 */
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { checkBasketAccess } from "@/lib/baskets/access";
import MemoryClient from "./MemoryClient";
import { fetchProjection } from "@/lib/api/projection";

async function fetchProjectionSafe(basketId: string) {
  try {
    return await fetchProjection(basketId);
  } catch (err) {
    console.error("Projection fetch failed", err);
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemoryPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerComponentClient({ cookies });

  // Consolidated authorization and basket access check
  const { basket } = await checkBasketAccess(supabase, id);

  // Fetch server-computed projection (authority)
  const projection = await fetchProjectionSafe(id);
  
  if (!projection) {
    // Fallback for API errors
    return (
      <MemoryClient
        basketId={id}
        pattern={undefined}
        tension={null}
        question={undefined}
        fallback="Unable to load reflections. Please try again."
      />
    );
  }

  const { reflections } = projection;
  const fallback = reflections.pattern
    ? `You keep orbiting "${reflections.pattern}".`
    : "Add a note to see what emerges.";

  return (
    <MemoryClient
      basketId={id}
      pattern={reflections.pattern}
      tension={reflections.tension}
      question={reflections.question}
      fallback={fallback}
    />
  );
}