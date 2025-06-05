// web/app/briefs/[id]/page.tsx

export default function BriefDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">📝 Brief Detail</h1>
      <p className="text-muted-foreground text-sm">
        Brief ID: {params?.id}
      </p>
    </div>
  );
}
