"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface StandardizedCardProps {
  variant?: "default" | "elevated" | "outlined" | "intelligence";
  size?: "sm" | "md" | "lg";
  header?: {
    title: string;
    subtitle?: string;
    icon?: string;
    badge?: {
      text: string;
      variant?: "default" | "secondary" | "outline";
    };
    actions?: Array<{
      label: string;
      icon?: string;
      onClick: () => void;
      variant?: "ghost" | "outline" | "default";
    }>;
  };
  footer?: {
    content: ReactNode;
    actions?: Array<{
      label: string;
      icon?: string;
      onClick: () => void;
      variant?: "ghost" | "outline" | "default";
    }>;
  };
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  loading?: boolean;
}

export default function StandardizedCard({
  variant = "default",
  size = "md",
  header,
  footer,
  children,
  className,
  interactive = false,
  loading = false
}: StandardizedCardProps) {
  const cardVariants = {
    default: "border bg-card",
    elevated: "border bg-card shadow-sm",
    outlined: "border-2 bg-card",
    intelligence: "border bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20"
  };

  const sizeVariants = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  };

  const interactiveClasses = interactive 
    ? "cursor-pointer hover:shadow-md transition-shadow duration-200" 
    : "";

  return (
    <Card className={cn(
      cardVariants[variant],
      sizeVariants[size],
      interactiveClasses,
      loading && "relative overflow-hidden",
      className
    )}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}

      {/* Header */}
      {header && (
        <div className="mb-4 pb-3 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {header.icon && (
                <div className="text-xl shrink-0">{header.icon}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm leading-none truncate">
                    {header.title}
                  </h3>
                  {header.badge && (
                    <Badge variant={header.badge.variant} className="text-xs">
                      {header.badge.text}
                    </Badge>
                  )}
                </div>
                {header.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {header.subtitle}
                  </p>
                )}
              </div>
            </div>
            
            {/* Header actions */}
            {header.actions && header.actions.length > 0 && (
              <div className="flex gap-1 shrink-0">
                {header.actions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.variant || "ghost"}
                    size="sm"
                    onClick={action.onClick}
                    className="h-7 px-2 text-xs"
                  >
                    {action.icon && <span className="mr-1">{action.icon}</span>}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "space-y-3",
        !header && !footer && "space-y-0"
      )}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {footer.content}
            </div>
            
            {/* Footer actions */}
            {footer.actions && footer.actions.length > 0 && (
              <div className="flex gap-2 shrink-0">
                {footer.actions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.variant || "ghost"}
                    size="sm"
                    onClick={action.onClick}
                    className="text-xs"
                  >
                    {action.icon && <span className="mr-1">{action.icon}</span>}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// Specialized variants for common use cases
export function IntelligenceCard(props: Omit<StandardizedCardProps, 'variant'>) {
  return <StandardizedCard {...props} variant="intelligence" />;
}

export function ActionCard(props: Omit<StandardizedCardProps, 'interactive'>) {
  return <StandardizedCard {...props} interactive={true} />;
}

export function LoadingCard(props: Omit<StandardizedCardProps, 'loading'>) {
  return <StandardizedCard {...props} loading={true} />;
}