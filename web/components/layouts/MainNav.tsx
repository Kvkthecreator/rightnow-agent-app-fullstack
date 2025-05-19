"use client";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MainNavProps {
  /**
   * Toggle mobile sidebar visibility
   */
  onNavToggle?: () => void;
}

export default function MainNav({ onNavToggle }: MainNavProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between p-4 md:py-2 md:px-4 border-b border-border bg-background">
      <div className="flex items-center">
        {onNavToggle && (
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden mr-3 p-2"
            onClick={onNavToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {/* Optional: page title or breadcrumbs can go here */}
      </div>
      <div />
    </header>
  );
}