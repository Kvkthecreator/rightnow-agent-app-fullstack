"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface SectionSwitcherProps {
  basketId: string;
  className?: string;
}

interface Section {
  key: string;
  label: string;
  path: string;
}

const BASKET_SECTIONS: Section[] = [
  { key: "memory", label: "Memory", path: "/memory" },
  { key: "documents", label: "Documents", path: "/documents" },
  { key: "blocks", label: "Blocks", path: "/blocks" },
  { key: "graph", label: "Graph", path: "/graph" },
  { key: "reflections", label: "Reflections", path: "/reflections" },
  { key: "timeline", label: "Timeline", path: "/timeline" },
];

export default function SectionSwitcher({ basketId, className }: SectionSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentSection = BASKET_SECTIONS.find(section => 
    pathname.includes(`/baskets/${basketId}${section.path}`)
  ) || BASKET_SECTIONS[0];

  const handleSectionChange = (section: Section) => {
    router.push(`/baskets/${basketId}${section.path}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent, section: Section) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSectionChange(section);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const currentIndex = BASKET_SECTIONS.findIndex(s => s.key === section.key);
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      const nextIndex = (currentIndex + direction + BASKET_SECTIONS.length) % BASKET_SECTIONS.length;
      const nextSection = BASKET_SECTIONS[nextIndex];
      handleSectionChange(nextSection);
      
      // Focus the new section
      setTimeout(() => {
        const nextElement = document.querySelector(`[data-section-key="${nextSection.key}"]`) as HTMLElement;
        nextElement?.focus();
      }, 0);
    }
  };

  if (isMobile) {
    return (
      <div className={cn("px-6 py-3 border-b bg-muted/30", className)}>
        <Select 
          value={currentSection.key} 
          onValueChange={(value) => {
            const section = BASKET_SECTIONS.find(s => s.key === value);
            if (section) handleSectionChange(section);
          }}
        >
          <SelectTrigger 
            className="w-full h-9 text-sm font-medium"
            aria-label="Section"
          >
            <SelectValue>{currentSection.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BASKET_SECTIONS.map((section) => (
              <SelectItem key={section.key} value={section.key}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn("px-6 py-3 border-b bg-muted/30", className)}>
      <div 
        className="flex gap-1 overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Basket sections"
      >
        {BASKET_SECTIONS.map((section) => {
          const isActive = section.key === currentSection.key;
          return (
            <button
              key={section.key}
              data-section-key={section.key}
              onClick={() => handleSectionChange(section)}
              onKeyDown={(e) => handleKeyDown(e, section)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded transition-colors",
                "hover:bg-background/80 whitespace-nowrap",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isActive 
                  ? "bg-background text-foreground shadow-sm border" 
                  : "text-muted-foreground"
              )}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              aria-controls={`section-${section.key}`}
              tabIndex={isActive ? 0 : -1}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}