// web/app/creations/[outputID]/page.tsx

interface PageProps {
  params: Promise<{ outputID: string }>;
}

export default async function OutputDetailPage({ params }: PageProps) {
  const { outputID } = await params;
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">📦 Output</h1>
      <p className="text-muted-foreground text-sm">
        Output ID: {outputID}
      </p>
    </div>
  );
}
