import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { apiUrl } from "@/lib/api";

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

  const canSubmit =
    !submitting &&
    state.basketName.trim().length > 0 &&
    state.coreBlock.length >= 100 &&
    state.coreBlock.length <= 500 &&
    state.dumps.length > 0 &&
    state.dumps.every((d) => d.trim().length > 0);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        template_id: "universal",
        basket_name: state.basketName,
        core_block: {
          text: state.coreBlock,
          scope: "basket",
          status: "locked",
        },
        raw_dumps: state.dumps.map((d) => ({ body_md: d })),
        guidelines: state.guidelines.trim() || null,
      };
      const res = await fetchWithToken(
        apiUrl("/baskets/new"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error("create failed");
      const { basket_id } = await res.json();
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
