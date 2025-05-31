// web/app/briefs/[briefID]/page.tsx

import Shell from "@/components/layouts/Shell";

interface Props {
  params: { briefID: string };
}

export default function BriefDetailPage({ params }: Props) {
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
