import { getSnapshot } from "@/lib/baskets/getSnapshot";
import BasketWorkClient from "./BasketWorkClient";
import BlocksPane from "@/components/blocks/BlocksPane";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { cookies } from "next/headers";

// Match Next 15's PageProps expectation: `params` is a Promise.
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BasketWorkPage({ params }: PageProps) {
  // Unwrap the promise that Next hands us
  const { id } = await params;
  const cookieStore = cookies();

  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) {
    return <div className="p-6 text-red-600">Not authenticated</div>;
  }

  // 1st-paint / SEO fetch
  const initialData = await getSnapshot(supabase, id);

  return (
    <BasketWorkClient
      id={id}
      initialData={initialData}
      rightPanel={
        <div className="right-panel">
          <BlocksPane blocks={initialData.proposed_blocks} />
        </div>
      }
    />
  );
}
