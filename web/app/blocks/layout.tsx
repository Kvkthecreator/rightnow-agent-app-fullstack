"use client";

import { ReactNode } from "react";
import Shell from "@/components/layouts/Shell";

export default function Layout({ children }: { children: ReactNode }) {
    return <Shell>{children}</Shell>;
}
