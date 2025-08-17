import DashboardCenter from "@/components/features/basket/centers/DashboardCenter";
import CenterBoundary from "@/components/common/CenterBoundary";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/dbTypes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/baskets/${id}/work`);
  }
  return (
    <CenterBoundary skeletonType="dashboard">
      <DashboardCenter basketId={id} />
    </CenterBoundary>
  );
}