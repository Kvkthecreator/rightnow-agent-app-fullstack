"use client";

import useSWR from "swr";
import { apiPost } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { isAuthError } from "@/lib/utils";
import type { BasketSnapshot } from "@/lib/baskets/getSnapshot";
import { getSnapshot } from "@/lib/baskets/getSnapshot";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import WorkbenchLayout from "@/components/workbench/WorkbenchLayout";
import BlocksPane from "@/components/blocks/BlocksPane";
import BlockCreateModal from "@/components/blocks/BlockCreateModal";
import { createBlock } from "@/lib/supabase/blocks";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export interface Props {
    id: string;
    initialData: BasketSnapshot;
}

export default function BasketWorkClient({ id, initialData }: Props) {
    const router = useRouter();
    const supabase = createBrowserSupabaseClient();
    const [running, setRunning] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data, error, isLoading, mutate } = useSWR<BasketSnapshot>(
        id,
        () => getSnapshot(supabase, id),
        { fallbackData: initialData },
    );

    async function handleCreate(data: {
        type: string;
        label: string;
        content: string;
        meta_tags?: string;
    }) {
        await createBlock({
            basket_id: id,
            semantic_type: data.type,
            label: data.label,
            content: data.content,
            state: "PROPOSED",
            meta_tags: data.meta_tags
                ? data.meta_tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                : [],
        });
        mutate();
    }

    const runBlockifier = async () => {
        setRunning(true);
        try {
            await apiPost("/api/agents/orch_block_manager/run", {
                basket_id: id,
            });
            toast.success("Parsing complete");
            mutate();
        } catch (err: any) {
            isAuthError(err)
                ? router.push("/login")
                : toast.error(err?.message || "Failed to run Blockifier");
        } finally {
            setRunning(false);
        }
    };

    if (isLoading) return <div className="p-6">Loading…</div>;
    if (error || !data)
        return <div className="p-6 text-red-600">Failed to load basket.</div>;

    const rightPanel = (
        <div className="right-panel">
            <div className="p-2 border-b">
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                    + New Block
                </Button>
            </div>
            <BlocksPane blocks={data.proposed_blocks} />
        </div>
    );

    return (
        <>
            <WorkbenchLayout
                snapshot={data}
                onRunBlockifier={runBlockifier}
                runningBlockifier={running}
                onSelectBlock={(bid) => console.log("select", bid)}
                rightPanel={rightPanel}
            />
            <BlockCreateModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onCreate={handleCreate}
                includeAuto={false}
            />
        </>
    );
}
