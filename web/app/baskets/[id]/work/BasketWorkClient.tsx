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
import { RightPanelSkeleton } from "@/components/layout/RightPanel";
import { useState } from "react";

export interface Props {
    id: string;
    initialData: BasketSnapshot;
    rightPanel?: React.ReactNode;
}

export default function BasketWorkClient({ id, initialData, rightPanel }: Props) {
    const router = useRouter();
    const supabase = createBrowserSupabaseClient();
    const [running, setRunning] = useState(false);

    const { data, error, isLoading, mutate } = useSWR<BasketSnapshot>(
        id,
        () => getSnapshot(supabase, id),
        { fallbackData: initialData },
    );

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

    return (
        <WorkbenchLayout
            snapshot={data}
            onRunBlockifier={runBlockifier}
            runningBlockifier={running}
            onSelectBlock={(bid) => console.log("select", bid)}
            rightPanel={rightPanel || <RightPanelSkeleton />}
        />
    );
}
