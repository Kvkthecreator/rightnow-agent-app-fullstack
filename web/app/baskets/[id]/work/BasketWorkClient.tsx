"use client";

import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { isAuthError } from "@/lib/utils";
import type { BasketSnapshot } from "@/lib/baskets/getSnapshot";
import { getSnapshot } from "@/lib/baskets/getSnapshot";

export interface Props {
  id: string;
  initialData: BasketSnapshot;
}

export default function BasketWorkClient({ id, initialData }: Props) {
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR<BasketSnapshot>(
    id,
    getSnapshot,
    { fallbackData: initialData }
  );

  const runBlockifier = async () => {
    try {
      await apiPost("/api/agents/orch_block_manager/run", { basket_id: id });
      toast.success("Parsing complete");
      mutate();
    } catch (err) {
      isAuthError(err)
        ? router.push("/login")
        : toast.error("Failed to run Blockifier");
    }
  };

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error || !data)
    return <div className="p-6 text-red-600">Failed to load basket.</div>;

  const { raw_dump_body = "", blocks = [] } = data;

  const grouped = {
    CONSTANT: blocks.filter((b) => b.state === "CONSTANT"),
    LOCKED:   blocks.filter((b) => b.state === "LOCKED"),
    ACCEPTED: blocks.filter((b) => b.state === "ACCEPTED"),
    PROPOSED: blocks.filter((b) => b.state === "PROPOSED"),
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Button onClick={runBlockifier}>Run Blockifier</Button>

      <section>
        <h2 className="font-semibold mb-2">Raw Dump</h2>
        {raw_dump_body ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose">
            {raw_dump_body}
          </ReactMarkdown>
        ) : (
          <p className="text-gray-500 text-sm">
            No raw dump content available.
          </p>
        )}
      </section>

      {Object.entries(grouped).map(([state, arr]) => (
        <section key={state}>
          <h3 className="font-semibold text-lg">
            {state === "CONSTANT" ? "★"
              : state === "LOCKED" ? "🔒"
              : state === "ACCEPTED" ? "■"
              : "□"}{" "}
            {state}
          </h3>
          {arr.length ? (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {arr.map((b) => (
                <li key={b.id}>{b.content ?? "No content"}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-xs">
              No blocks in this state.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
