"use client";
import { ReactNode } from "react";
import Shell from "@/components/layouts/Shell";
import { usePathname } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isWorkbench =
        /^\/baskets\/[^/]+(?:\/docs\/[^/]+)?\/work$/.test(pathname);
    if (isWorkbench) {
        return <>{children}</>;
    }
    return <Shell>{children}</Shell>;
}
