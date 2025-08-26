import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { resolveTargetBasket } from "@/lib/baskets/resolveTargetBasket";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ONBOARDING_ENABLED } from "@/lib/env";

export default async function WelcomePage() {
  if (!ONBOARDING_ENABLED) {
    redirect('/baskets');
  }

  const basketId = await resolveTargetBasket({ headers: { Cookie: cookies().toString() } });
  return (
    <section className="min-h-screen flex items-center justify-center p-4">
      <OnboardingForm
        basketId={basketId}
        redirectTo={`/baskets/${basketId}/memory?onboarded=1`}
      />
    </section>
  );
}
