"use client";
import { useState } from "react";
import BlocksList from "./BlocksList";
import { usePendingChanges } from "@/lib/baskets/usePendingChanges";
import { fetchWithToken } from "@/lib/fetchWithToken";

interface Props {
    basketId: string;
    highlightCommitId?: string | null;
}

export default function BlocksWorkspace({
    basketId,
    highlightCommitId,
}: Props) {
    const pending = usePendingChanges(basketId);
    const [summary, setSummary] = useState<string | null>(null);

    const handleSummarizeSession = async () => {
        const res = await fetchWithToken("/api/summarize-session", {
            method: "POST",
            body: JSON.stringify({ basket_id: basketId }),
        });
        const { summary } = await res.json();
        setSummary(summary);
    };

    return (
        <section className="flex-1 flex flex-col overflow-hidden">
            <header className="h-10 px-6 flex items-center border-b gap-2 justify-between">
                <h2 className="sr-only">Blocks</h2>
                {pending > 0 && (
                    <button className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md">
                        ⚠︎ {pending} change{pending > 1 ? "s" : ""}
                    </button>
                )}
                <button
                    onClick={handleSummarizeSession}
                    aria-label="Summarize recent progress"
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md"
                >
                    🪄 Summarize Recent Progress
                </button>
            </header>

            {summary && (
                <div className="bg-muted p-4 text-sm border-b font-mono text-muted-foreground">
                    <strong>Summary:</strong> {summary}
                </div>
            )}

            <BlocksList
                basketId={basketId}
                highlightCommitId={highlightCommitId}
            />
        </section>
    );
}
