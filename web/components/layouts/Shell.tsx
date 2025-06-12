"use client";
import React, { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import MobileSidebarToggle from "@/components/MobileSidebarToggle";

interface ShellProps {
    children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
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
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}
            <Sidebar open={open} onClose={() => setOpen(false)} />
            <main className="p-6">
                <div className="mb-4 md:hidden">
                    <MobileSidebarToggle onClick={() => setOpen(true)} />
                </div>
                {children}
            </main>
        </div>
    );
}
