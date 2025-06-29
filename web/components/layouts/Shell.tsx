"use client";
import React, { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import MobileSidebarToggle from "@/components/MobileSidebarToggle";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface ShellProps {
    children: ReactNode;
    collapseSidebar?: boolean;
}

export default function Shell({ children, collapseSidebar = false }: ShellProps) {
    const pathname = usePathname();
    const hideSidebarByPath =
        pathname?.includes("/baskets/") &&
        (pathname.endsWith("/work") || pathname.endsWith("/work-dev"));
    const shouldCollapse = collapseSidebar || hideSidebarByPath;
    const [sidebarVisible, setSidebarVisible] = useState(!hideSidebarByPath);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSidebarVisible(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <div className="min-h-screen md:flex">
            {/* Screen overlay */}
            {sidebarVisible && shouldCollapse && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarVisible(false)}
                />
            )}
            {sidebarVisible && (
                <Sidebar
                    open={true}
                    onClose={() => setSidebarVisible(false)}
                    collapsible={shouldCollapse}
                />
            )}
            <main className="p-6 flex-1">
                <div className={cn("mb-4", shouldCollapse ? undefined : "md:hidden")}
                >
                    <MobileSidebarToggle onClick={() => setSidebarVisible(!sidebarVisible)} />
                </div>
                {children}
            </main>
        </div>
    );
}
