"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { 
  Home, 
  Lightbulb, 
  Brain, 
  BookOpen, 
  Clock,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";
import { useState } from "react";
import { ProgressiveDisclosure } from "../narrative/ProgressiveDisclosure";

interface NavigationHubProps {
  minimized?: boolean;
  className?: string;
  basketId?: string;
}

interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Strategic Intelligence',
    icon: Home,
    href: '/dashboard/home',
    description: 'Your AI partnership overview'
  },
  {
    key: 'insights',
    label: 'Insights & Ideas',
    icon: Lightbulb,
    href: '/baskets',
    description: 'Captured thoughts and discoveries'
  },
  {
    key: 'understanding',
    label: 'My Understanding',
    icon: Brain,
    href: '/work',
    description: 'What I know about your goals'
  },
  {
    key: 'knowledge',
    label: 'Project Knowledge',
    icon: BookOpen,
    href: '/queue',
    description: 'Documents and shared context'
  },
  {
    key: 'timeline',
    label: 'Evolution',
    icon: Clock,
    href: '/creations',
    description: 'How your project has grown'
  }
];

export function NavigationHub({ minimized = false, className = "", basketId }: NavigationHubProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(!minimized);

  const handleNavigation = (href: string) => {
    // If we have a basketId and navigating to baskets, include it
    if (basketId && href === '/baskets') {
      router.push(`/baskets/${basketId}`);
    } else {
      router.push(href);
    }
  };

  const isActive = (href: string) => {
    if (href === '/baskets' && pathname.startsWith('/baskets')) return true;
    return pathname === href;
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
          {NAV_ITEMS.map((item) => {
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
        {/* Header with collapse button */}
        <div className="flex items-center justify-between mb-6">
          {isExpanded && (
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

        {/* Navigation Items */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
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

        {/* Progressive Disclosure for Navigation Help */}
        {isExpanded && (
          <div className="mt-8 pt-4 border-t">
            <ProgressiveDisclosure
              story="I'm here to help you navigate your work"
              reasoning="I organize your navigation based on how you typically interact with different parts of your project, making it easy to switch between strategic planning and detailed work."
              substrate={{
                navigation_items: NAV_ITEMS.map(item => ({
                  key: item.key,
                  href: item.href,
                  active: isActive(item.href)
                })),
                current_path: pathname,
                basket_context: basketId
              }}
            />
          </div>
        )}
      </div>
    </nav>
  );
}