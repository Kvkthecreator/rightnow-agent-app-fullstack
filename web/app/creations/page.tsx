//web/app/creations/page.tsx

"use client";

import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useEffect } from "react";

export default function CreationsPage() {
  const { session, isLoading } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  if (isLoading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🎨 Creations</h1>
      <Card>
        <p className="text-sm text-muted-foreground">
          These are your final outputs — PromptBlocks, Markdown, JSON and more.
        </p>
      </Card>
      {/* TODO: Render list of outputs here */}
    </div>
  );
}
