/**
 * Page: /baskets/[id]/history - Deep History Stream (Canon v1.3)
 * Data sources:
 *  - GET /api/baskets/:id/history?cursor= -> HistoryPage
 * @contract renders: HistoryPage (append-only stream with filters)
 */
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getServerUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HistoryPage({ params }: PageProps) {
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

  // Fetch timeline data from legacy timeline API
  const baseUrl = getServerUrl();
  let timelineItems = [];
  try {
    const res = await fetch(`${baseUrl}/api/baskets/${id}/timeline`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      timelineItems = data.items || [];
    }
  } catch (error) {
    console.warn("Failed to fetch timeline data:", error);
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-gray-600 mt-1">
          Append-only stream of basket activity with filters and search
        </p>
      </div>
      
      <div className="space-y-4">
        {timelineItems.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="space-y-4">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No History Yet</h3>
              <p className="text-sm text-gray-500">
                Activity will appear here as you work with this basket
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {timelineItems.map((item: any, idx: number) => (
              <li key={idx} className="rounded-xl border shadow-sm p-4">
                {item.summary}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}