import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface Section {
  id: string;
  label: string;
  icon: string;
}

interface SectionNavProps {
  sections: Section[];
  activeSection?: string;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

export function SectionNav({
  sections,
  activeSection,
  onSectionClick,
  className,
}: SectionNavProps) {
  // Use activeSection prop directly if provided, otherwise track via intersection
  const [observedSection, setObservedSection] = useState(sections[0]?.id);
  const currentActive = activeSection || observedSection;
  const isManualScrollRef = useRef(false);

  // Intersection Observer to track visible sections
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Only update if not manually scrolling
            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.3 &&
              !isManualScrollRef.current
            ) {
              setObservedSection(section.id);
            }
          });
        },
        {
          threshold: 0.3,
          rootMargin: "-100px 0px -50% 0px",
        },
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sections]);

  const handleClick = useCallback(
    (sectionId: string) => {
      // Mark as manual scroll to prevent intersection observer from overriding
      isManualScrollRef.current = true;
      setObservedSection(sectionId);

      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Reset manual scroll flag after animation completes
        setTimeout(() => {
          isManualScrollRef.current = false;
        }, 1000);
      }

      onSectionClick?.(sectionId);
    },
    [onSectionClick],
  );

  if (sections.length === 0) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-2",
        className,
      )}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-1 px-1 min-w-max">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={currentActive === section.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handleClick(section.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap transition-all",
                currentActive === section.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="text-base">{section.icon}</span>
              <span className="hidden sm:inline text-xs">{section.label}</span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
}
