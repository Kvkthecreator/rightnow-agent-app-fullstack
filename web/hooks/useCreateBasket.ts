import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";

interface WizardState {
  basketName: string;
  coreBlock: string;
  dumps: string[];
  guidelines: string;
}

const KEY = "rn-sp-wizard";

const emptyState: WizardState = {
  basketName: "",
  coreBlock: "",
  dumps: [],
  guidelines: "",
};

export function useCreateBasket() {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(() => {
    if (typeof window === "undefined") return emptyState;
    const stored = localStorage.getItem(KEY);
    if (stored) {
      try {
        return { ...emptyState, ...JSON.parse(stored) } as WizardState;
      } catch {
        return emptyState;
      }
    }
    return emptyState;
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(state));
    }
  }, [state]);

  const setBasketName = (v: string) =>
    setState((s) => ({ ...s, basketName: v }));
  const setCoreBlock = (v: string) =>
    setState((s) => ({ ...s, coreBlock: v }));
  const setDump = (i: number, v: string) =>
    setState((s) => {
      const arr = [...s.dumps];
      arr[i] = v;
      return { ...s, dumps: arr };
    });
  const addDump = () =>
    setState((s) => ({ ...s, dumps: [...s.dumps, ""] }));
  const setGuidelines = (v: string) =>
    setState((s) => ({ ...s, guidelines: v }));

  const canSubmit = !submitting && state.basketName.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const workspaceId =
        (typeof window !== "undefined" &&
          localStorage.getItem("workspace_id")) ||
        "00000000-0000-0000-0000-000000000001";
      const payload = {
        workspace_id: workspaceId,
        name: state.basketName || "Untitled Basket",
        idempotency_key: crypto.randomUUID(),
      };
      const { basket_id } = await apiClient.request<{ basket_id: string }>(
        "/api/baskets/new",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      router.push(`/baskets/${basket_id}/work`);
      setState(emptyState);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    basketName: state.basketName,
    coreBlock: state.coreBlock,
    dumps: state.dumps,
    guidelines: state.guidelines,
    setBasketName,
    setCoreBlock,
    setDump,
    addDump,
    setGuidelines,
    submit,
    mutate: submit,
    canSubmit,
  };
}
