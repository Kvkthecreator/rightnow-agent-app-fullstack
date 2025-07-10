import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBasketFromTemplate } from "@/lib/baskets/createBasketFromTemplate";
import { createClient } from "@/lib/supabaseClient";

export interface WizardState {
  templateId?: string;
  stepIndex: number;
  templateState: Record<string, any>;
}

export function useTemplateWizard() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>();
  const [stepIndex, setStepIndex] = useState(0);
  const [templateSteps, setTemplateSteps] = useState<React.ComponentType<any>[]>([]);
  const [templateLabels, setTemplateLabels] = useState<string[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [templateTitle, setTemplateTitle] = useState("");

  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [guidelines, setGuidelines] = useState("");

  const selectTemplate = async (id: string) => {
    const [mod, copy] = await Promise.all([
      import(`@/components/template-flows/${id}/steps`),
      import(`@/components/template-flows/${id}/copy`),
    ]);
    const steps: React.ComponentType<any>[] = mod.steps ?? mod.default ?? [];
    const labels: string[] = mod.stepLabels ?? [];
    setTemplateSteps(steps);
    setTemplateLabels(labels);
    setTemplateId(id);
    setDocCount(copy.DOC_COUNT ?? 0);
    setTemplateTitle(copy.copy?.title ?? "");
    setStepIndex(1);
  };

  const next = () => {
    const max = templateSteps.length;
    setStepIndex((s) => (s < max ? s + 1 : s));
  };
  const back = () => setStepIndex((s) => (s > 0 ? s - 1 : s));

  const createBasket = async () => {
    if (!templateId) return;
    const { basket_id } = await createBasketFromTemplate({
      template_id: templateId,
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

  const stepLabels = ["Template", ...templateLabels];

  return {
    stepIndex,
    stepLabels,
    next,
    back,
    selectTemplate,
    templateSteps,
    createBasket,
    fileUrls,
    setFileUrls,
    guidelines,
    setGuidelines,
    docCount,
    templateTitle,
  };
}
