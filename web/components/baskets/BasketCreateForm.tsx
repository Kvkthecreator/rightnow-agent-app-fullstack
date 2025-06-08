"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { UploadArea } from "@/components/ui/UploadArea";
import { buildContextBlocks } from "@/lib/baskets/submit";

interface Props {
  onSubmit?: (blocks: any[]) => void;
}

export default function BasketCreateForm({ onSubmit }: Props) {
  const [intent, setIntent] = useState("");
  const [objective, setObjective] = useState("");
  const [insight, setInsight] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const addRef = (url: string) => setRefs((r) => (r.length < 3 ? [...r, url] : r));
  const removeRef = (url: string) => setRefs((r) => r.filter((u) => u !== url));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const blocks = buildContextBlocks({
      topic: intent,
      intent: objective,
      insight,
      references: refs,
    });
    onSubmit?.(blocks);
  };

  return (
    <Card className="mt-8 mx-auto max-w-2xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">What are we working on?</h2>
            <p className="text-sm text-muted-foreground">
              Start with a short, descriptive task or request.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Intent</label>
            <Input
              placeholder="e.g. Launch a new product on Instagram"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">What’s the objective?</label>
            <Input
              placeholder="e.g. Drive signups to waitlist"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reference files</label>
            <UploadArea
              prefix="basket"
              bucket="block-files"
              maxFiles={3}
              onUpload={addRef}
              preview
              removable
              enableDrop
              showPreviewGrid
            />
            {refs.length > 0 && (
              <ul className="text-sm space-y-1">
                {refs.map((u) => (
                  <li key={u} className="flex justify-between">
                    <span className="truncate mr-2">{u}</span>
                    <button
                      type="button"
                      onClick={() => removeRef(u)}
                      className="text-red-600"
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Extra insight (optional)</label>
            <Textarea
              placeholder="Any background context or ideas we should know?"
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full">
            Create Basket
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
