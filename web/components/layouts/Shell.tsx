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
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <div className="min-h-screen md:flex">
            {/* Screen overlay */}
            {open && (
                <div
                    className={cn(
                        "fixed inset-0 z-40 bg-black/50",
                        shouldCollapse ? undefined : "md:hidden"
                    )}
                    onClick={() => setOpen(false)}
                />
            )}
            <Sidebar
                open={shouldCollapse ? open : true}
                onClose={() => setOpen(false)}
                collapsible={shouldCollapse}
                className={hideSidebarByPath && !open ? "hidden md:hidden" : undefined}
            />
            <main className="p-6 flex-1">
                <div className={cn("mb-4", shouldCollapse ? undefined : "md:hidden")}
                >
                    <MobileSidebarToggle onClick={() => setOpen(true)} />
                </div>
                {children}
            </main>
        </div>
    );
}
