"use client";
import React, { ReactNode, useEffect } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import MobileSidebarToggle from "@/components/MobileSidebarToggle";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/lib/stores/sidebarStore";

interface ShellProps {
    children: ReactNode;
    collapseSidebar?: boolean;
}

export default function Shell({ children, collapseSidebar = false }: ShellProps) {
    const pathname = usePathname();
    const hideSidebarByPath =
        pathname?.includes("/baskets/") &&
        (pathname.endsWith("/work") || pathname.endsWith("/work-dev"));
    const forceShowHamburger = hideSidebarByPath;
    const { isOpen, openSidebar, closeSidebar, collapsible } = useSidebarStore();

    useEffect(() => {
        if (hideSidebarByPath) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }, [hideSidebarByPath, openSidebar, closeSidebar]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeSidebar();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [closeSidebar]);

    const shouldCollapse = collapsible || hideSidebarByPath || collapseSidebar;

    return (
        <div className="min-h-screen md:flex">
            {/* Screen overlay */}
            {isOpen && shouldCollapse && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={closeSidebar}
                />
            )}
            {isOpen && <Sidebar />}
            <main className="p-6 flex-1">
                <div className={cn("mb-4", shouldCollapse ? undefined : "md:hidden")}
                >
                    <MobileSidebarToggle
                        onClick={() => (isOpen ? closeSidebar() : openSidebar())}
                        forceShow={forceShowHamburger}
                    />
                </div>
                {children}
            </main>
        </div>
    );
}
