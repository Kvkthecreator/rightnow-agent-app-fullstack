"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveUserState = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return router.replace("/login");

        const { data: workspace } = await supabase
          .from("workspaces")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (!workspace) {
          setError("Workspace not found or could not be created.");
          setLoading(false);
          return;
        }

        const { data: baskets } = await supabase
          .from("baskets")
          .select("id")
          .eq("workspace_id", workspace.id)
          .limit(1);

        if (baskets && baskets.length > 0) {
          router.replace(`/baskets/${baskets[0].id}/work`);
        } else {
          router.replace("/baskets/new?mode=wizard");
        }
      } catch (err) {
        console.error("Error resolving user state:", err);
        setError("Something went wrong while setting up your workspace.");
        setLoading(false);
      }
    };

    resolveUserState();
  }, []);

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardContent className="py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Preparing your workspace...
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button onClick={() => router.push("/settings")}>Go to Settings</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
