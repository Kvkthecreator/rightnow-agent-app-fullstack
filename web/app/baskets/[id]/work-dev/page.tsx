import WorkbenchLayoutDev from "@/components/workbench/WorkbenchLayoutDev";
import { redirect } from "next/navigation";
import { MOCK_SNAPSHOT } from "@/lib/baskets/mockSnapshot";
import BlocksPane from "@/components/blocks/BlocksPane";
import { DEV_MOCK_BLOCKS } from "@/lib/blocks/dev_mock_blocks";

// Match Next 15's PageProps expectation: `params` is a Promise.
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BasketWorkDevPage({ params }: PageProps) {
  const { id } = await params;

  if (!process.env.NEXT_PUBLIC_ENABLE_WORK_DEV) {
    redirect(`/baskets/${id}/work`);
  }

  // 🚧 Skip Supabase auth + server fetch — use mock directly
  const initialSnapshot = MOCK_SNAPSHOT;

  return (
    <WorkbenchLayoutDev
      initialSnapshot={initialSnapshot}
      rightPanel={
        <div className="right-panel">
          <BlocksPane blocks={DEV_MOCK_BLOCKS} />
        </div>
      }
    />
  );
}
