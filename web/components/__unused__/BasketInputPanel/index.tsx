"use client";
import PreviewDrawer from "./PreviewDrawer";
import UploadButton from "./UploadButton";
import { useBasketInput } from "./useBasketInput";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import type { BasketInputPayload } from "./types";

interface BasketInputPanelProps {
  mode?: "create" | "edit";
  basketId?: string;
  initial?: Partial<BasketInputPayload>;
}

export default function BasketInputPanel({ mode = "create", basketId, initial }: BasketInputPanelProps) {
  const { inputText, setInputText, intent, setIntent } = useBasketInput(initial);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!intent.trim()) {
      toast.error("Intent is required");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/baskets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, details: inputText || undefined, file_ids: [] }),
    });
    setLoading(false);
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/baskets/${id}/work`);
    } else {
      toast.error("Basket creation failed. Please check your inputs.");
    }
  }

  async function handleUpdate() {
    if (!basketId) return;
    if (!intent.trim()) {
      toast.error("Intent is required");
      return;
    }
    await fetch(`/api/baskets/${basketId}/work`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_text: inputText, intent_summary: intent }),
    });
    router.refresh();
  }

  return (
    <Card className="p-6 max-w-xl">
      <form
        className="space-y-6"
        onSubmit={mode === "create" ? handleCreate : (e) => {e.preventDefault();handleUpdate();}}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">What are you trying to do?</label>
          <p className="text-sm text-muted-foreground">Describe the goal or task in your own words.</p>
          <Input
            placeholder="Plan a product launch"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Describe your request</label>
          <p className="text-sm text-muted-foreground">Paste a prompt, steps, or related background.</p>
          <textarea
            className="w-full p-3 rounded-lg border border-input bg-input text-base text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Drop your idea, prompt, or GPT reply…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Upload related files</label>
          <p className="text-sm text-muted-foreground">You can include screenshots, notes, or drafts.</p>
          <UploadButton onUpload={() => {}} />
        </div>
        <PreviewDrawer />
        <div className="pt-2">
          {mode === "create" ? (
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Basket"}
            </Button>
          ) : (
            <Button type="submit">Update Basket</Button>
          )}
        </div>
      </form>
    </Card>
  );
}
