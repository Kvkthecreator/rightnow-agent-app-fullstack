/**
 * Page: /baskets/[id]/memory - Primary Operating Surface (Canon v2.0)
 * 
 * Now uses real P3 reflections instead of projection-based data.
 * MemoryClient directly fetches P3 reflection artifacts for insights display.
 */
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { checkBasketAccess } from "@/lib/baskets/access";
import { BasketWrapper } from "@/components/basket/BasketWrapper";
import MemoryClient from "./MemoryClient";
import { hasIdentityGenesis, isBlankBasket } from "@/lib/server/onboarding";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { ModeOnboardingPanel } from "@/components/basket-mode/ModeOnboardingPanel";
import { loadBasketModeConfig } from "@/basket-modes/loader";
import type { BasketModeId } from "@/basket-modes/types";

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
  const { basket: basketAccess } = await checkBasketAccess(supabase, id);

  // Fetch full basket data for context (extending the access check data)
  const { data: basketDetails } = await supabase
    .from('baskets')
    .select('description, status, created_at, last_activity_ts, tags, origin_template, mode, name')
    .eq('id', id)
    .maybeSingle();

  // Combine access data with details, using safe defaults for optional fields
  const basket = {
    id: basketAccess.id,
    name: basketDetails?.name ?? basketAccess.name,
    workspace_id: basketAccess.workspace_id,
    description: basketDetails?.description || null,
    status: basketDetails?.status || null,
    created_at: basketDetails?.created_at || new Date().toISOString(),
    last_activity_ts: basketDetails?.last_activity_ts || null,
    tags: basketDetails?.tags || null,
    origin_template: basketDetails?.origin_template || null,
    mode: (basketDetails?.mode ?? basketAccess.mode ?? 'default') as string,
  };

  const modeConfig = await loadBasketModeConfig(
    (basket.mode ?? 'default') as BasketModeId,
  );

  // Check if user needs onboarding (only if basket blank AND no identity genesis)
  const { userId } = await getAuthenticatedUser(supabase);
  const [blank, hasGenesis] = await Promise.all([
    isBlankBasket(id),
    hasIdentityGenesis(id),
  ]);
  const needsOnboarding = blank && !hasGenesis;

  return (
    <BasketWrapper basket={basket} modeConfig={modeConfig}>
      <div className="space-y-6 pb-8">
        <ModeOnboardingPanel />
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
    </BasketWrapper>
  );
}
