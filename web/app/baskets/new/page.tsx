"use client";
export const dynamic = "force-dynamic";
import { CreationModeToggle } from "@/components/template-wizard/CreationModeToggle";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBasketNew } from "@/lib/baskets/createBasketNew";
import { SinglePageWizard } from "@/components/wizard/SinglePageWizard";
import { useCreationMode } from "@/lib/hooks/useCreationMode";
import { Suspense } from "react";

function InstantBasketRedirector() {
    const router = useRouter();
    useEffect(() => {
        const go = async () => {
            const { id } = await createBasketNew({
                text_dump: null,
                file_urls: [],
            });
            router.replace(`/baskets/${id}/work`);
        };
        go();
    }, [router]);
    return (
        <div className="p-8 text-muted-foreground">Creating your basket...</div>
    );
}

function NewBasketInner() {
    const { mode, setMode } = useCreationMode();
    return (
        <div className="flex flex-col items-center pt-8">
            <CreationModeToggle mode={mode} onChange={setMode} />
            {mode === "wizard" ? (
                <div data-testid="wizard">
                    <SinglePageWizard />
                </div>
            ) : (
                <InstantBasketRedirector />
            )}
        </div>
    );
}

export default function NewBasketPage() {
    return (
        <Suspense>
            <NewBasketInner />
        </Suspense>
    );
}
