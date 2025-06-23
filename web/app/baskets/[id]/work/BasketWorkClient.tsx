// app/baskets/[id]/work/BasketWorkClient.tsx
"use client";

import type { JSX } from "react";
import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { isAuthError } from "@/lib/utils";
import type { BasketSnapshot } from "@/lib/baskets/getSnapshot";   // ← put it back
import { getSnapshot } from "@/lib/baskets/getSnapshot";           // ← runtime fetcher

export interface Props {
  id: string;
  initialData: BasketSnapshot;
}

export default function BasketWorkClient({ id, initialData }: Props): JSX.Element {
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR<BasketSnapshot>(
    id,
    getSnapshot,
    { fallbackData: initialData }
  );

  /* …rest of your component exactly as before… */
  return <div>…</div>;
}
