"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useSWR from "swr";
import { apiPost } from "@/lib/api";
import type { BasketSnapshot } from "@/lib/baskets/getSnapshot";
import { getSnapshot } from "@/lib/baskets/getSnapshot";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { isAuthError } from "@/lib/utils";

export default function BasketWorkPage({ params }: any) {
  const id = params.id as string;
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<BasketSnapshot>(
    id,
    getSnapshot
  );

  const runBlockifier = async () => {
    try {
      await apiPost(`/api/agents/orch_block_manager/run`, { basket_id: id });
      toast.success("Parsing complete");
      mutate();
    } catch (err) {
      if (isAuthError(err)) {
        router.push("/login");
      } else {
        toast.error("Failed to run Blockifier");
      }
    }
  };

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load basket.</div>;

  const raw = data?.raw_dump_body ?? "";

  const blocks = data?.blocks ?? [];
  const grouped = {
    CONSTANT: blocks.filter((b) => b.state === "CONSTANT"),
    LOCKED: blocks.filter((b) => b.state === "LOCKED"),
    ACCEPTED: blocks.filter((b) => b.state === "ACCEPTED"),
    PROPOSED: blocks.filter((b) => b.state === "PROPOSED"),
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
