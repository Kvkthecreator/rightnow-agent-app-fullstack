import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBasketFromTemplate } from "@/lib/baskets/createBasketFromTemplate";
import { createClient } from "@/lib/supabaseClient";

export type WizardStep = 0 | 1 | 2 | 3;

export function useTemplateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(0);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [guidelines, setGuidelines] = useState("");

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s));
  const back = () => setStep((s) => (s > 0 ? ((s - 1) as WizardStep) : s));

  const createBasket = async () => {
    const { basket_id } = await createBasketFromTemplate({
      template_id: "multi_doc_consistency",
      files: fileUrls,
      guidelines: guidelines.trim() || undefined,
    });

    const supabase = createClient();
    const { data } = await supabase
      .from("documents")
      .select("id")
      .eq("basket_id", basket_id)
      .order("created_at")
      .limit(1)
      .single();

    const firstDoc = data?.id;
    if (firstDoc) {
      router.push(`/baskets/${basket_id}/docs/${firstDoc}/work`);
    } else {
      router.push(`/baskets/${basket_id}/work`);
    }
  };

  return {
    step,
    next,
    back,
    setStep,
    createBasket,
    fileUrls,
    setFileUrls,
    guidelines,
    setGuidelines,
  };
}
