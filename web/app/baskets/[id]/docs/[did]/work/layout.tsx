import DocumentList from "@/components/documents/DocumentList";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string; did: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { id, did } = await params;
  return (
    <div className="md:flex w-full">
      <aside className="hidden md:block w-[220px] shrink-0 border-r overflow-y-auto">
        <DocumentList basketId={id} activeId={did} />
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
