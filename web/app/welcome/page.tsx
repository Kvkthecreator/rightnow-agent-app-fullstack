import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { resolveTargetBasket } from "@/lib/baskets/resolveTargetBasket";
import { cookies } from "next/headers";

export default async function WelcomePage() {
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
