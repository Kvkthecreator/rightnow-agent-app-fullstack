import BasketLeftNav from "./BasketLeftNav";
import BasketCreationNav from "./BasketCreationNav";
import type { BasketSnapshot } from "@/lib/baskets/getSnapshot";

export interface BasketWorkbenchLayoutProps {
    snapshot: BasketSnapshot;
    documentId?: string;
    documents: { id: string; title?: string | null }[];
    rightPanel?: React.ReactNode;
    children?: React.ReactNode;
}

export default function BasketWorkbenchLayout({
    snapshot,
    documentId,
    documents,
    rightPanel,
    children,
}: BasketWorkbenchLayoutProps) {
    return (
        <div className="flex h-full">
            {/* Left-side creation buttons */}
            <BasketCreationNav
                onCreateContext={() => console.log("Create Context")}
                onCreateBlock={() => console.log("Create Block")}
                onCreateDocument={() => console.log("Create Document")}
                onCreateDump={() => console.log("Create Dump")}
            />

            <BasketLeftNav
                basketId={snapshot.basket.id}
                basketName={snapshot.basket.name ?? "Untitled"}
                contextItems={[]}
                blocks={snapshot.blocks}
                documents={documents}
                documentId={documentId}
            />

            <div className="flex-1 flex flex-col">
                <div className="flex-1 grid grid-cols-3">
                    <div className="col-span-2 overflow-y-auto p-4">
                        {children}
                    </div>
                    {rightPanel && (
                        <div className="col-span-1 border-l p-4">
                            {rightPanel}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
