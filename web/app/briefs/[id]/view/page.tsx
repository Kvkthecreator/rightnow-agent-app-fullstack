/* simple read-only view of draft brief */
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";

export default function BriefView({ params }: any) {
  const supabase = createClient();
  const [brief, setBrief] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBrief = async () => {
      const { data } = await supabase
        .from("task_briefs")
        .select("*")
        .eq("id", params.id)
        .single();
      setBrief(data);
    };
    fetchBrief();
  }, [params.id]);

  if (!brief) return <p className="p-4">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Draft Brief</h1>
      <p><b>Intent:</b> {brief.intent}</p>
      {brief.sub_instructions && <p><b>Sub-instructions:</b> {brief.sub_instructions}</p>}
      <pre className="bg-gray-50 p-4 rounded">{JSON.stringify(brief.core_context_snapshot, null, 2)}</pre>

      <div className="flex gap-4">
        <Button
          onClick={() =>
            window.open(`/api/brief/${brief.id}/config/download?format=md`)
          }
        >
          Download .md
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            window.open(`/api/brief/${brief.id}/config/download?format=json`)
          }
        >
          Download .json
        </Button>
      </div>
    </div>
  );
}
