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
      const payload = {
        name: state.basketName || "Untitled Basket",
        status: "active",
        tags: [],
      };
      const { id } = await apiClient.request<{id: string}>("/api/baskets/new", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/baskets/${id}/work`);
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
