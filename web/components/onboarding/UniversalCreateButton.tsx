"use client";

import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
  context?: "dashboard" | "navigation" | "empty-state" | "inline";
}

export default function UniversalCreateButton({
  variant = "default",
  size = "md", 
  className,
  children,
  context = "inline"
}: Props) {
  const router = useRouter();

  const handleCreateProject = () => {
    router.push("/onboarding");
  };

  // Context-specific button content and styling
  const getButtonContent = () => {
    switch (context) {
      case "dashboard":
        return (
          <>
            <div className="text-xl mb-2">✨</div>
            <div>
              <div className="font-semibold">Create Intelligent Project</div>
              <div className="text-sm opacity-90">
                I'll help you set up a complete project with AI insights
              </div>
            </div>
          </>
        );
      
      case "navigation":
        return (
          <>
            <span className="mr-2">✨</span>
            Create Project
          </>
        );
      
      case "empty-state":
        return (
          <>
            <div className="text-2xl mb-3">🚀</div>
            <div className="font-semibold mb-1">Create Your First Project</div>
            <div className="text-sm text-muted-foreground">
              I'll guide you through creating an intelligent project in just a few minutes
            </div>
          </>
        );
      
      default:
        return children || (
          <>
            <span className="mr-2">✨</span>
            Create Project
          </>
        );
    }
  };

  const getButtonClassName = () => {
    const baseClasses = "transition-all duration-200 hover:scale-105";
    
    switch (context) {
      case "dashboard":
        return cn(
          baseClasses,
          "h-auto p-6 flex-col items-center text-center bg-gradient-to-br from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90",
          className
        );
      
      case "empty-state":
        return cn(
          baseClasses,
          "h-auto p-8 flex-col items-center text-center bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-500/90 hover:to-emerald-600/90",
          className
        );
      
      default:
        return cn(baseClasses, className);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCreateProject}
      className={getButtonClassName()}
    >
      {getButtonContent()}
    </Button>
  );
}

// Specialized variants for common use cases

export function DashboardCreateButton({ className }: { className?: string }) {
  return (
    <UniversalCreateButton
      context="dashboard"
      size="lg"
      className={className}
    />
  );
}

export function NavigationCreateButton({ className }: { className?: string }) {
  return (
    <UniversalCreateButton
      context="navigation"
      size="sm"
      className={className}
    />
  );
}

export function EmptyStateCreateButton({ className }: { className?: string }) {
  return (
    <UniversalCreateButton
      context="empty-state"
      size="lg"
      className={className}
    />
  );
}

// Legacy compatibility - gradually replace existing "New Basket" buttons
export function NewBasketButton({ 
  children, 
  className,
  ...props 
}: { 
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <UniversalCreateButton
      className={cn("bg-primary hover:bg-primary/90", className)}
      {...props}
    >
      {children || (
        <>
          <span className="mr-2">✨</span>
          Create Workspace
        </>
      )}
    </UniversalCreateButton>
  );
}