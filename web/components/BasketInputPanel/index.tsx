"use client";
import PreviewDrawer from "./PreviewDrawer";
import UploadButton from "./UploadButton";
import { useBasketInput } from "./useBasketInput";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface BasketInputPanelProps {
  mode?: "create" | "edit";
}

export default function BasketInputPanel({ mode = "create" }: BasketInputPanelProps) {
  const { inputText, setInputText, intent, setIntent } = useBasketInput();
  const router = useRouter();

  async function handleCreate() {
    const res = await fetch("/api/baskets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_text: inputText, intent_summary: intent, assets: [] }),
    });
    if (res.ok) {
      const { basket_id } = await res.json();
      router.push(`/baskets/${basket_id}`);
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        className="w-full border p-2"
        placeholder="Drop your idea, prompt, or GPT reply…"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <input
        className="w-full border p-2"
        placeholder="What’s the goal?"
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
      />
      <UploadButton onUpload={() => {}} />
      <PreviewDrawer />
      <div className="pt-2">
        <Button onClick={handleCreate}>Create Basket</Button>
      </div>
    </div>
  );
}
