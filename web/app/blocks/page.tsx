"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import BlockCard, { Block } from "@/components/blocks/BlockCard";
import BlockCreateModal from "@/components/blocks/BlockCreateModal";
import { fetchBlocks, createBlock, toggleAuto } from "@/lib/supabase/blocks";
import { createClient } from "@/lib/supabaseClient";
import { getOrCreateWorkspaceId } from "@/lib/workspaces";

export default function BlocksPage() {
    const { session, isLoading } = useSessionContext();
    const supabase = createClient();
    const router = useRouter();
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<"all" | "core">("all");
    const [scope, setScope] = useState<"user" | "agent" | "all">("user");
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

    useEffect(() => {
        if (!session) return;
        (async () => {
            const ws = await getOrCreateWorkspaceId(supabase, session.user.id);
            setWorkspaceId(ws);
        })();
    }, [session, supabase]);

    useEffect(() => {
        if (isLoading || !session || !workspaceId) return;
        if (!session) {
            router.replace("/about");
            return;
        }
        (async () => {
            const scopeList =
                scope === "user"
                    ? ["basket", "profile"]
                    : scope === "agent"
                      ? ["agent"]
                      : [];
            const { data } = await fetchBlocks(
                workspaceId,
                filter === "core",
                scopeList,
            );
            if (data) setBlocks(data as any);
        })();
    }, [session, isLoading, router, filter, scope, workspaceId]);

    async function handleCreate(data: {
        type: string;
        label: string;
        content: string;
        auto?: boolean;
        meta_tags?: string;
    }) {
        if (!session?.user) return;
        if (!workspaceId) return;
        setLoading(true);
        const { data: created } = await createBlock({
            user_id: session.user.id,
            workspace_id: workspaceId,
            type: data.type,
            label: data.label,
            content: data.content,
            update_policy: data.auto ? "auto" : "manual",
            is_core_block: false,
        });
        if (created) setBlocks((b) => [created as Block, ...b]);
        setLoading(false);
    }

    async function handleToggle(id: string, enable: boolean) {
        await toggleAuto(id, enable);
        setBlocks((b) =>
            b.map((blk) =>
                blk.id === id
                    ? { ...blk, update_policy: enable ? "auto" : "manual" }
                    : blk,
            ),
        );
    }

    if (isLoading) return null;

    const groups = blocks.reduce<Record<string, Block[]>>((acc, b) => {
        const key = b.meta_scope || "other";
        acc[key] = acc[key] || [];
        acc[key].push(b);
        return acc;
    }, {});

    const labels: Record<string, string> = {
        basket: "📦 From Basket",
        profile: "👤 Profile Setup",
        agent: "🤖 Agent Inference",
        global: "🌐 Global",
        other: "Other",
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">🧱 Context Blocks</h1>
                    <p className="text-sm text-muted-foreground">
                        Advanced Settings
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        size="sm"
                        variant={filter === "all" ? "default" : "outline"}
                        onClick={() => setFilter("all")}
                    >
                        All
                    </Button>
                    <Button
                        size="sm"
                        variant={filter === "core" ? "default" : "outline"}
                        onClick={() => setFilter("core")}
                    >
                        Core
                    </Button>
                    <select
                        className="border rounded px-2 py-1 text-sm"
                        value={scope}
                        onChange={(e) => setScope(e.target.value as any)}
                    >
                        <option value="user">User</option>
                        <option value="agent">Agent</option>
                        <option value="all">All</option>
                    </select>
                    <Button onClick={() => setShowModal(true)}>
                        + Create Block
                    </Button>
                </div>
            </div>
            <Card>
                <p className="text-sm text-muted-foreground">
                    Modular context units like tone, audience and positioning.
                </p>
            </Card>
            {blocks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                    No blocks found. You can create new ones from a basket or
                    task.
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groups).map(([k, arr]) => (
                        <div key={k} className="space-y-2">
                            <h3 className="font-medium">{labels[k]}</h3>
                            <div className="space-y-2">
                                {arr
                                    .filter((b) =>
                                        filter === "core"
                                            ? b.is_core_block
                                            : true,
                                    )
                                    .map((b) => (
                                        <BlockCard
                                            key={b.id}
                                            block={b}
                                            onToggleAuto={handleToggle}
                                        />
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* TODO: pending review queue and diff view */}
            <BlockCreateModal
                open={showModal}
                onOpenChange={setShowModal}
                onCreate={handleCreate}
            />
        </div>
    );
}
