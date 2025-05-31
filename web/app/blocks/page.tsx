//web/app/blocks/page.tsx

"use client";

import { Card } from "@/components/ui/Card";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BlocksPage() {
  const { session, isLoading } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      localStorage.setItem("postLoginRedirect", window.location.pathname);
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  if (isLoading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🧱 Context Blocks</h1>
      <Card>
        <p className="text-sm text-muted-foreground">
          Modular context units like tone, audience, and positioning. These are the foundation of your strategy.
        </p>
      </Card>
      {/* TODO: Render list of context_blocks here */}
    </div>
  );
}
