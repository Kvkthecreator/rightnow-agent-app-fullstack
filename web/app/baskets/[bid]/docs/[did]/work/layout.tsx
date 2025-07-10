import DocumentList from "@/components/documents/DocumentList";

interface LayoutProps {
  children: React.ReactNode;
  params: { bid: string; did: string };
}

export default function Layout({ children, params }: LayoutProps) {
  return (
    <div className="md:flex w-full">
      <aside className="hidden md:block w-[220px] shrink-0 border-r overflow-y-auto">
        <DocumentList basketId={params.bid} activeId={params.did} />
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
