/**
 * Page: /baskets/[id]/memory - Primary Operating Surface (Canon v2.0)
 * 
 * Now uses real P3 reflections instead of projection-based data.
 * MemoryClient directly fetches P3 reflection artifacts for insights display.
 */
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { checkBasketAccess } from "@/lib/baskets/access";
import MemoryClient from "./MemoryClient";
import { hasIdentityGenesis, isBlankBasket } from "@/lib/server/onboarding";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

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

  // Check if user needs onboarding (only if basket blank AND no identity genesis)
  const { userId } = await getAuthenticatedUser(supabase);
  const [blank, hasGenesis] = await Promise.all([
    isBlankBasket(id),
    hasIdentityGenesis(id),
  ]);
  const needsOnboarding = blank && !hasGenesis;

  return (
    <div className="space-y-6 pb-8">
      {onboarded && (
        <div className="rounded-lg border bg-green-50 p-4 text-sm text-green-700 flex justify-between">
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
        needsOnboarding={needsOnboarding}
      />
    </div>
  );
}
