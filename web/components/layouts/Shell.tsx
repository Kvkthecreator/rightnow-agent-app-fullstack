"use client";
import React, { ReactNode } from "react";
import Sidebar from "@/app/components/layout/Sidebar";

interface ShellProps {
    children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
    return (
        <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
            <Sidebar />
            <main className="p-6">{children}</main>
        </div>
    );
}
