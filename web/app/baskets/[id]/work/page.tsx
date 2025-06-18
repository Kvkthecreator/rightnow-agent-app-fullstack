"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useSWR from "swr";
import { apiPost, apiGet } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export default function BasketWorkPage({ params }: any) {
  const id = params.id as string;
  const { data, error, isLoading, mutate } = useSWR(
    `/api/baskets/${id}/snapshot`,
    apiGet
  );

  const runBlockifier = async () => {
    await apiPost(`/api/agents/orch_block_manager/run`, { basket_id: id });
    mutate();
  };

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load basket.</div>;

  const dumps = data?.raw_dumps ?? [];
  const blocks = data?.blocks ?? [];

  const grouped = {
    CONSTANT: blocks.filter((b: any) => b.state === "CONSTANT"),
    LOCKED: blocks.filter((b: any) => b.state === "LOCKED"),
    ACCEPTED: blocks.filter((b: any) => b.state === "ACCEPTED"),
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Button onClick={runBlockifier}>Run Blockifier</Button>

      <section>
        <h2 className="font-semibold mb-2">Raw Dump</h2>
        {dumps.map((d: any) => (
          <ReactMarkdown key={d.id} remarkPlugins={[remarkGfm]} className="prose">
            {d.content || d.body_md || ""}
          </ReactMarkdown>
        ))}
      </section>

      {(
        Object.entries(grouped) as ["CONSTANT" | "LOCKED" | "ACCEPTED", any[]][]
      ).map(([state, arr]) => (
        <section key={state}>
          <h3 className="font-semibold text-lg">
            {state === "CONSTANT" ? "★" : state === "LOCKED" ? "🔒" : "■"} {state}
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
