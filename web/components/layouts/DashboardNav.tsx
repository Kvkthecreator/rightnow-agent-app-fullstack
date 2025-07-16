"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, User } from "lucide-react";

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Baskets", href: "/baskets", icon: User },
    {
        title: "New Basket (guided)",
        href: "/baskets/new?mode=wizard",
        icon: User,
    },
    {
        title: "New Basket (blank)",
        href: "/baskets/new?mode=blank",
        icon: User,
    },
    { title: "Queue", href: "/queue", icon: User },
];

export default function DashboardNav() {
    const pathname = usePathname();

    return (
        <nav className="w-64 shrink-0 flex flex-col bg-white border-r border-gray-200 h-full">
            <div className="flex-1 overflow-y-auto">
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-4 py-2 text-sm font-medium space-x-2 hover:bg-gray-100",
                                active ? "bg-gray-100" : "",
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.title}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
