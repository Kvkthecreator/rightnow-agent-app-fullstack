//web/components/layouts/SidebarNav.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Home, User, Clipboard, FileText, LibraryIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import UserNav from "@/components/UserNav";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const baseItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Blocks", href: "/blocks", icon: LibraryIcon },
];

const briefItems: NavItem[] = [
  { title: "Briefs", href: "/briefs/create", icon: FileText },
  { title: "Tasks", href: "/tasks", icon: Clipboard },
  { title: "Creations", href: "/creations", icon: User },
];

const basketItems: NavItem[] = [
  { title: "Baskets", href: "/baskets/new", icon: FileText },
  { title: "Integrations", href: "/integrations", icon: Clipboard },
  { title: "Briefs", href: "/briefs/create", icon: FileText },
  { title: "Tasks", href: "/tasks", icon: Clipboard },
  { title: "Creations", href: "/creations", icon: User },
];

const getNavItems = (): NavItem[] =>
  process.env.NEXT_PUBLIC_NEXT_DUMP_FLOW === "true"
    ? [...baseItems, ...basketItems]
    : [...baseItems, ...briefItems];

interface SidebarNavProps {
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

export default function SidebarNav({
  collapsed = false,
  onCollapseToggle,
}: SidebarNavProps) {
  const pathname = usePathname();
  const navItems = getNavItems();

  return (
    <nav
      className={cn(
        "shrink-0 flex flex-col bg-background border-r border-border h-full transition-all duration-200 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="w-full py-4 px-5 flex justify-between items-center bg-white" />
        <div className="flex items-center p-4 border-b border-border">
          {onCollapseToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={onCollapseToggle}
            >
              <Image
                src="/assets/logos/yarn-logo-light.png"
                alt="Toggle sidebar"
                width={24}
                height={24}
                className="h-6 w-6"
              />
            </Button>
          )}
          {!collapsed && (
            <Link
              href="/"
              className="flex items-center gap-2 ml-2 text-black hover:text-black/80 transition-colors"
            >
              <span className="font-semibold text-lg">Yarnnn</span>
            </Link>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted",
                  collapsed ? "justify-center" : "space-x-2"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>

        {/* Sidebar footer: user menu */}
        <div
          className={cn(
            "flex items-center p-4 border-t border-border",
            collapsed ? "justify-center" : ""
          )}
        >
          <UserNav compact={collapsed} />
        </div>
      </div>
    </nav>
  );
}
