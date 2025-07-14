"use client";
import { ReactNode } from "react";
import BasketDocList from "@/components/basket/BasketDocList";
import WorkbenchTopBar from "@/components/workbench/WorkbenchTopBar";
import NarrativePane from "@/components/basket/NarrativePane";
import type { BasketSnapshot } from "@/lib/baskets/getSnapshot";
import RightPanelLayout from "@/components/layout/RightPanel";

interface Props {
    snapshot: BasketSnapshot;
    onRunBlockifier?: () => void;
    runningBlockifier?: boolean;
    onSelectBlock?: (id: string) => void;
    rightPanel?: ReactNode;
    children?: ReactNode;
}

export default function WorkbenchLayout({
    snapshot,
    onRunBlockifier,
    runningBlockifier,
    onSelectBlock,
    rightPanel,
    children,
}: Props) {
    return (
        <div className="md:flex w-full min-h-screen">
            <aside className="hidden md:block w-[220px] shrink-0 border-r overflow-y-auto">
                <BasketDocList basketId={snapshot.basket.id} />
            </aside>
            <div className="flex-1 flex flex-col">
                <WorkbenchTopBar
                    basketName={snapshot.basket?.name || "Untitled Basket"}
                    status="DRAFT"
                    actions={onRunBlockifier ? (
                        <button
                            className="text-sm text-primary"
                            onClick={onRunBlockifier}
                            disabled={runningBlockifier}
                        >
                            {runningBlockifier ? "Running..." : "Run Blockifier"}
                        </button>
                    ) : null}
                />
                <RightPanelLayout rightPanel={rightPanel} className="flex-1">
                    <div className="p-4 space-y-4">
                        <NarrativePane
                            rawText={snapshot.raw_dump_body}
                            blocks={snapshot.blocks || []}
                            onSelectBlock={onSelectBlock}
                        />
                        {children}
                    </div>
                </RightPanelLayout>
            </div>
        </div>
    );
}
