"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { UploadArea } from "@/components/ui/UploadArea";
import { createBasket } from "@/lib/baskets/submit";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface Props {
  onSuccess?: (id: string) => void;
}

export default function BasketCreateForm({ onSuccess }: Props) {
  const [topic, setTopic] = useState("");
  const [intent, setIntent] = useState("");
  const [insight, setInsight] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const addRef = (url: string) => setRefs((r) => (r.length < 3 ? [...r, url] : r));
  const removeRef = (url: string) => setRefs((r) => r.filter((u) => u !== url));

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !intent.trim() || refs.length === 0) {
      toast.error(
        "Please complete all required fields: topic, intent, and at least one reference file."
      );
      return;
    }
    setLoading(true);
    try {
      const { id } = await createBasket({
        topic,
        intent,
        insight,
        reference_file_ids: refs,
      });
      onSuccess?.(id);
      router.push(`/baskets/${id}/work`);
    } catch (err) {
      console.error(err);
      toast.error("Basket creation failed. Please check required fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">What are we working on?</h1>
      <Card className="w-full">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic \u2022</label>
            <Input
              placeholder="e.g. Launch a new product on Instagram"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Intent \u2022</label>
            <Input
              placeholder="e.g. Drive signups to waitlist"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create Basket"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
