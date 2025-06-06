"use client";
import { useState } from "react";
import type { BasketInputPayload, InputAsset } from "./types";

export function useBasketInput(initial?: Partial<BasketInputPayload>) {
  const [inputText, setInputText] = useState(initial?.input_text || "");
  const [intent, setIntent] = useState(initial?.intent_summary || "");
  const [assets, setAssets] = useState<InputAsset[]>(initial?.assets || []);

  return {
    inputText,
    setInputText,
    intent,
    setIntent,
    assets,
    setAssets,
  };
}
