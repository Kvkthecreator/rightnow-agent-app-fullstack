import WorkbenchLayoutDev from "@/components/workbench/WorkbenchLayoutDev";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { MOCK_SNAPSHOT } from "@/lib/baskets/mockSnapshot";

// Match Next 15's PageProps expectation: `params` is a Promise.
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BasketWorkDevPage({ params }: PageProps) {
  // Unwrap the promise that Next hands us
  const { id } = await params;

  if (!process.env.NEXT_PUBLIC_ENABLE_WORK_DEV) {
    redirect(`/baskets/${id}/work`);
  }

  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) {
    return <div className="p-6 text-red-600">Not authenticated</div>;
  }

  // 1st-paint / SEO fetch
  // Use the mocked snapshot data for early development.
  const initialSnapshot = MOCK_SNAPSHOT;

  return <WorkbenchLayoutDev initialSnapshot={initialSnapshot} />;
}
