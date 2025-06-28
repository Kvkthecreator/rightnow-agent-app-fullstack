"use client";
import { ReactNode } from "react";
import BasketHeader from "@/components/basket/BasketHeader";
import NarrativePane from "@/components/basket/NarrativePane";
import type { BasketSnapshot } from "@/lib/baskets/getSnapshot";

interface Props {
    snapshot: BasketSnapshot;
    onRunBlockifier?: () => void;
    onSelectBlock?: (id: string) => void;
    children?: ReactNode;
}

export default function WorkbenchLayout({
    snapshot,
    onRunBlockifier,
    onSelectBlock,
    children,
}: Props) {
    const scopes = Array.from(
        new Set((snapshot.blocks || []).map((b) => b.scope).filter(Boolean)),
    ) as string[];

    return (
        <div className="min-h-screen p-4 space-y-4">
            <BasketHeader
                basketName={snapshot.basket?.name || "Untitled Basket"}
                status="DRAFT"
                scope={scopes}
                onRunBlockifier={onRunBlockifier}
            />
            <NarrativePane
                rawText={snapshot.raw_dump_body}
                blocks={snapshot.blocks || []}
                onSelectBlock={onSelectBlock}
            />
            {children}
        </div>
    );
}
