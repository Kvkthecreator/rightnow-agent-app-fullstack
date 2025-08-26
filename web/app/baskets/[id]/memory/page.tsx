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
import OnboardingGate from "@/components/memory/OnboardingGate";
import { isBlankBasket, hasIdentityGenesis } from "@/lib/server/onboarding";
import { ONBOARDING_ENABLED, ONBOARDING_MODE } from "@/lib/env";

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
  searchParams?: Promise<Record<string, string | undefined>>;
}

export default async function MemoryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const qs = searchParams ? await searchParams : {};
  const profileId = qs.profile;
  const onboarded = qs.onboarded;
  const supabase = createServerComponentClient({ cookies });

  // Consolidated authorization and basket access check
  const { basket } = await checkBasketAccess(supabase, id);

  const showOnboarding =
    ONBOARDING_ENABLED &&
    ONBOARDING_MODE !== "welcome" &&
    (await isBlankBasket(id)) &&
    !(await hasIdentityGenesis(id));

  if (showOnboarding) {
    return <OnboardingGate basketId={id} />;
  }

  // Fetch server-computed projection (authority)
  const projection = await fetchProjectionSafe(id);
  
  if (!projection) {
    // Fallback for API errors
    return (
      <MemoryClient
        basketId={id}
        pattern={undefined}
        tension={undefined}
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
    <div className="space-y-4">
      {onboarded && (
        <div className="rounded-md border bg-green-50 p-4 text-sm text-green-700 flex justify-between">
          <span>Memory initialized from your First Mirror.</span>
          {profileId && (
            <a
              className="underline font-medium"
              href={`/baskets/${id}/documents/${profileId}`}
            >
              Open Profile
            </a>
          )}
        </div>
      )}
      <MemoryClient
        basketId={id}
        pattern={reflections.pattern ?? undefined}
        tension={reflections.tension ?? undefined}
        question={reflections.question ?? undefined}
        fallback={fallback}
      />
    </div>
  );
}