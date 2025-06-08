// web/lib/baskets/submit.ts

export interface BasketValues {
  topic: string;
  intent: string;
  insight?: string;
  references: string[];
}

export interface ContextBlock {
  id?: string;
  type: "topic" | "intent" | "reference" | "insight";
  label: string;
  content: string;
  is_primary: boolean;
  meta_scope: "basket";
  source?: string;
  associated_block_id?: string;
}

export function buildContextBlocks(values: BasketValues): ContextBlock[] {
  if (!values.topic.trim()) throw new Error("Topic required");
  if (!values.intent.trim()) throw new Error("Intent required");
  if (values.references.length === 0) throw new Error("At least one reference required");

  const blocks: ContextBlock[] = [];

  blocks.push({
    type: "topic",
    label: values.topic.slice(0, 50),
    content: values.topic,
    is_primary: true,
    meta_scope: "basket",
  });

  blocks.push({
    type: "intent",
    label: values.intent.slice(0, 50),
    content: values.intent,
    is_primary: true,
    meta_scope: "basket",
  });

  values.references.forEach((url) => {
    blocks.push({
      type: "reference",
      label: url.split("/").pop() || "file",
      content: url,
      is_primary: true,
      meta_scope: "basket",
      source: "user_upload",
    });
  });

  if (values.insight && values.insight.trim()) {
    blocks.push({
      type: "insight",
      label: values.insight.slice(0, 50),
      content: values.insight,
      is_primary: true,
      meta_scope: "basket",
    });
  }

  return blocks;
}

import { apiPost } from "../api";

export async function createBasket(values: BasketValues): Promise<{ id: string }> {
  const blocks = buildContextBlocks(values);
  const payload = {
    topic: values.topic,
    intent: values.intent,
    insight: values.insight,
    blocks,
  };
  return apiPost<{ id: string }>("/api/baskets", payload);
}
