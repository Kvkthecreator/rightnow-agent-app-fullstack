"use client";
import React, { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import MobileSidebarToggle from "@/components/MobileSidebarToggle";
import { cn } from "@/lib/utils";

interface ShellProps {
    children: ReactNode;
    collapseSidebar?: boolean;
}

export default function Shell({ children, collapseSidebar = false }: ShellProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
            {/* Screen overlay */}
            {open && (
                <div
                    className={cn(
                        "fixed inset-0 z-40 bg-black/50",
                        collapseSidebar ? undefined : "md:hidden"
                    )}
                    onClick={() => setOpen(false)}
                />
            )}
            <Sidebar
                open={collapseSidebar ? open : true}
                onClose={() => setOpen(false)}
                collapsible={collapseSidebar}
            />
            <main className="p-6">
                <div className={cn("mb-4", collapseSidebar ? undefined : "md:hidden")}
                >
                    <MobileSidebarToggle onClick={() => setOpen(true)} />
                </div>
                {children}
            </main>
        </div>
    );
}
