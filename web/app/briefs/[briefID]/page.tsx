// web/app/briefs/[briefID]/page.tsx

import { Metadata } from "next";
import Shell from "@/components/layouts/Shell";

// Optional: Dynamic metadata (if needed)
export async function generateMetadata({ params }: { params: { briefID: string } }): Promise<Metadata> {
  return {
    title: `Brief ${params.briefID}`,
  };
}

export default function BriefDetailPage({ params }: { params: { briefID: string } }) {
  return (
    <Shell>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">📝 Brief {params.briefID}</h1>
        <p className="text-sm text-muted-foreground">
          Detail view for brief ID: {params.briefID}
        </p>
      </div>
    </Shell>
  );
}
