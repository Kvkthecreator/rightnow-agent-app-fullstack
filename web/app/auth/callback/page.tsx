"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallbackPage() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                setError("Authentication failed. Please try logging in again.");
                setTimeout(() => router.replace("/login"), 1500);
                return;
            }

            const storedPath =
                typeof window !== "undefined"
                    ? localStorage.getItem("postLoginPath")
                    : null;

            if (storedPath) {
                localStorage.removeItem("postLoginPath");
                router.replace(storedPath);
                return;
            }

            const { data: baskets } = await supabase
                .from("baskets")
                .select("id")
                .order("created_at", { ascending: false })
                .limit(1);

            if (baskets && baskets.length > 0) {
                router.replace(`/baskets/${baskets[0].id}/work?tab=dashboard`);
            } else {
                const { data: newBasket, error } = await supabase
                    .from("baskets")
                    .insert({ name: "Untitled Basket" })
                    .select("id")
                    .single();

                if (error || !newBasket?.id) {
                    setError(
                        "Something went wrong while creating your first basket.",
                    );
                    return;
                }

                router.replace(`/baskets/${newBasket.id}/work?tab=dashboard`);
            }
        };

        checkSession();
    }, [router, supabase]);

    if (error) {
        return <div className="text-center py-20 text-red-600">{error}</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-lg font-medium">Signing you in…</p>
        </div>
    );
}
