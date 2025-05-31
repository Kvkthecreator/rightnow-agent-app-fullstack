// web/app/creations/[outputID]/page.tsx

export default function OutputDetailPage({ params }: any) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">📦 Output</h1>
      <p className="text-muted-foreground text-sm">
        Output ID: {params?.outputID}
      </p>
    </div>
  );
}
