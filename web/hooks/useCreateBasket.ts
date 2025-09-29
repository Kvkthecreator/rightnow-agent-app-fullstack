import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

const STORAGE_KEY = 'yarnnn:new-basket-wizard';

export interface BasketAnchorDraft {
  problemStatement: string;
  primaryCustomer: string;
  productVision: string;
  successMetrics: string;
}

interface WizardState extends BasketAnchorDraft {
  basketName: string;
}

const EMPTY_STATE: WizardState = {
  basketName: '',
  problemStatement: '',
  primaryCustomer: '',
  productVision: '',
  successMetrics: '',
};

export function useCreateBasket() {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(() => {
    if (typeof window === 'undefined') return EMPTY_STATE;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return EMPTY_STATE;
    try {
      return { ...EMPTY_STATE, ...JSON.parse(stored) } as WizardState;
    } catch {
      return EMPTY_STATE;
    }
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const setField = (key: keyof WizardState) => (value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const trimmedAnchors = useMemo(() => ({
    problemStatement: state.problemStatement.trim(),
    primaryCustomer: state.primaryCustomer.trim(),
    productVision: state.productVision.trim(),
    successMetrics: state.successMetrics.trim(),
  }), [state.problemStatement, state.primaryCustomer, state.productVision, state.successMetrics]);

  const hasAnchorDraft = Object.values(trimmedAnchors).some((value) => value.length > 0);
  const canSubmit = !submitting && state.basketName.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        idempotency_key: crypto.randomUUID(),
        basket: { name: state.basketName.trim() || 'Untitled Basket' },
      };

      const response = await apiClient.request<{ basket_id: string }>(
        '/api/baskets/new',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      const basketId = response.basket_id;

      if (hasAnchorDraft) {
        try {
          await apiClient.request(`/api/baskets/${basketId}/anchors/bootstrap`, {
            method: 'POST',
            body: JSON.stringify(trimmedAnchors),
          });
        } catch (error) {
          // Non-fatal: log so the user can add anchors manually in the memory view.
          console.warn('Bootstrap anchors failed', error);
        }
      }

      setState(EMPTY_STATE);
      router.push(`/baskets/${basketId}/memory`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    basketName: state.basketName,
    problemStatement: state.problemStatement,
    primaryCustomer: state.primaryCustomer,
    productVision: state.productVision,
    successMetrics: state.successMetrics,
    setBasketName: setField('basketName'),
    setProblemStatement: setField('problemStatement'),
    setPrimaryCustomer: setField('primaryCustomer'),
    setProductVision: setField('productVision'),
    setSuccessMetrics: setField('successMetrics'),
    submit,
    mutate: submit,
    canSubmit,
    submitting,
    hasAnchorDraft,
  };
}
