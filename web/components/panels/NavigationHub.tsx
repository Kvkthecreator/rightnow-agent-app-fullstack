"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { 
  BarChart3, 
  FileText, 
  Lightbulb, 
  Settings, 
  Clock,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";
import { useState } from "react";

interface NavigationHubProps {
  minimized?: boolean;
  className?: string;
  basketId?: string;
  basketName?: string;
}

interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
}

const getNavItems = (basketId?: string): NavItem[] => [
  {
    key: 'dashboard',
    label: 'Strategic Intelligence',
    icon: BarChart3,
    href: basketId ? `/baskets/${basketId}/dashboard` : '/dashboard/home',
    description: 'AI insights and project understanding'
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: FileText,
    href: basketId ? `/baskets/${basketId}/documents` : '/documents',
    description: 'Live editing workspace'
  },
  {
    key: 'insights',
    label: 'Insights & Ideas',
    icon: Lightbulb,
    href: basketId ? `/baskets/${basketId}/documents` : '/insights',
    description: 'Manage discoveries and connections'
  },
  {
    key: 'timeline',
    label: 'Project Timeline',
    icon: Clock,
    href: basketId ? `/baskets/${basketId}/timeline` : '/timeline',
    description: 'History and evolution (Coming Soon)'
  },
  {
    key: 'settings',
    label: 'Project Settings',
    icon: Settings,
    href: basketId ? `/baskets/${basketId}/settings` : '/settings',
    description: 'Project configuration'
  }
];

export function NavigationHub({ minimized = false, className = "", basketId, basketName }: NavigationHubProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(!minimized);
  const navItems = getNavItems(basketId);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const isActive = (href: string) => {
    // Exact match or match with query params
    const basePath = href.split('?')[0];
    const currentPath = pathname.split('?')[0];
    return currentPath === basePath || pathname === href;
  };

  // Show minimal navigation when minimized
  if (minimized && !isExpanded) {
    return (
      <nav className={`navigation-hub-minimal w-16 bg-muted/30 border-r flex flex-col py-4 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="mb-4 mx-auto"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 space-y-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Button
                key={item.key}
                variant={active ? "default" : "ghost"}
                size="sm"
                onClick={() => handleNavigation(item.href)}
                className="w-full justify-center p-2"
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className={`navigation-hub ${isExpanded ? 'w-72' : 'w-16'} bg-muted/30 border-r transition-all duration-300 ${className}`}>
      <div className="p-4">
        {/* Basket Header */}
        {isExpanded && basketName && (
          <div className="nav-header mb-6 pb-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 truncate">{basketName}</h2>
            <p className="text-sm text-gray-500">Project Workspace</p>
          </div>
        )}
        
        {/* Header with collapse button for non-basket contexts */}
        {(!basketName || !isExpanded) && (
          <div className="flex items-center justify-between mb-6">
            {isExpanded && !basketName && (
              <h2 className="text-lg font-semibold">Navigate</h2>
            )}
            {minimized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-auto"
              >
                {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <div key={item.key} className="relative group">
                <Button
                  variant={active ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 transition-all ${
                    isExpanded ? '' : 'justify-center px-2'
                  }`}
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className={`${isExpanded ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0`} />
                  {isExpanded && (
                    <div className="text-left flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.description}
                      </div>
                    </div>
                  )}
                </Button>
                
                {/* Tooltip for minimized state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <div className="bg-popover text-popover-foreground border rounded-md shadow-md p-2 whitespace-nowrap">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Clean navigation - no progressive disclosure here */}
      </div>
    </nav>
  );
}