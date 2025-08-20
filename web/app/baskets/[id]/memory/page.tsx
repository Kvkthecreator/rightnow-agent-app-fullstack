/**
 * Page: /baskets/[id]/memory - Primary Operating Surface (Canon v1.3)
 * Data sources:
 *  - GET /api/baskets/:id/projection -> ProjectionDTO
 * @contract renders: ProjectionDTO (Left: Capture, Center: History, Right: Projection)
 */
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import MemoryClient from "./MemoryClient";

async function fetchProjection(basketId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || "https://www.yarnnn.com";
  const res = await fetch(`${base}/api/baskets/${basketId}/projection`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookies().toString() // Forward auth cookies
    },
    cache: "no-store",
  });
  
  if (!res.ok) {
    console.error(`Projection fetch failed: ${res.status} ${res.statusText}`);
    return null;
  }
  
  return res.json();
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemoryPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerComponentClient({ cookies });

  // Verify basket access
  const workspace = await ensureWorkspaceServer(supabase);
  if (!workspace) {
    notFound();
  }

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .single();

  if (!basket) {
    notFound();
  }

  // Fetch server-computed projection (authority)
  const projection = await fetchProjection(id);
  
  if (!projection) {
    // Fallback for API errors
    return (
      <MemoryClient
        basketId={id}
        pattern={undefined}
        tension={null}
        question={undefined}
        fallback="Unable to load reflections. Please try again."
      />
    );
  }

  const { reflections } = projection;
  const fallback = reflections.pattern
    ? `You keep orbiting "${reflections.pattern}".`
    : "Add a note to see what emerges.";

  return (
    <MemoryClient
      basketId={id}
      pattern={reflections.pattern}
      tension={reflections.tension}
      question={reflections.question}
      fallback={fallback}
    />
  );
}