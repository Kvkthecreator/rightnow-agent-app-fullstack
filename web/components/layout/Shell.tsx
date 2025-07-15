"use client";
import React, { useEffect } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import TopBar from "@/components/common/TopBar";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { usePathname } from "next/navigation";

export default function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { openSidebar, closeSidebar, setCollapsible } = useSidebarStore();

    useEffect(() => {
        const hideSidebar =
            pathname.startsWith("/baskets/new") ||
            /^\/blocks\/[^/]+$/.test(pathname);

        setCollapsible(hideSidebar);

        if (hideSidebar) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }, [pathname, setCollapsible, openSidebar, closeSidebar]);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <TopBar />
                <main className="flex-1 overflow-y-auto px-4 pt-16 md:pt-8 md:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
