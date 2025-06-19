"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useSWR from "swr";
import { apiPost, apiGet } from "@/lib/api";
import type { Snapshot } from "@/lib/baskets/getSnapshot";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";

export default function BasketWorkPage({ params }: any) {
  const id = params.id as string;
  const { data, error, isLoading, mutate } = useSWR<Snapshot>(
    `/api/baskets/${id}/snapshot`,
    apiGet
  );

  const runBlockifier = async () => {
    try {
      await apiPost(`/api/agents/orch_block_manager/run`, { basket_id: id });
      toast.success("Parsing complete");
      mutate();
    } catch (err) {
      toast.error("Failed to run Blockifier");
    }
  };

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load basket.</div>;

  const raw = data?.raw_dump ?? "";

  const grouped = {
    CONSTANT: data?.constants ?? [],
    LOCKED: data?.locked_blocks ?? [],
    ACCEPTED: data?.accepted_blocks ?? [],
    PROPOSED: data?.proposed_blocks ?? [],
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Button onClick={runBlockifier}>Run Blockifier</Button>

      <section>
        <h2 className="font-semibold mb-2">Raw Dump</h2>
        {raw && (
          <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose">
            {raw}
          </ReactMarkdown>
        )}
      </section>

      {(
        Object.entries(grouped) as [
          "CONSTANT" | "LOCKED" | "ACCEPTED" | "PROPOSED",
          any[],
        ][]
      ).map(([state, arr]) => (
        <section key={state}>
          <h3 className="font-semibold text-lg">
            {state === "CONSTANT"
              ? "★"
              : state === "LOCKED"
              ? "🔒"
              : state === "ACCEPTED"
              ? "■"
              : "□"}{" "}
            {state}
          </h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {arr.map((b) => (
              <li key={b.id}>{b.content}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
