import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className: string;
  background: ReactNode;
  Icon: React.ElementType;
  description: string;
  href: string;
  cta: string;
  featured?: boolean;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  featured,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-1 sm:col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl",
      // light styles
      "bg-card border border-border/50",
      "shadow-sm hover:shadow-xl hover:shadow-primary/5",
      // dark styles
      "dark:bg-card/50 dark:backdrop-blur-sm",
      "dark:hover:border-primary/20",
      // transitions
      "transform-gpu transition-all duration-500 ease-out",
      "hover:-translate-y-1",
      className,
    )}
    {...props}
  >
    {/* Background effects */}
    <div className="absolute inset-0 overflow-hidden">{background}</div>

    {/* Content */}
    <div className="relative z-10 flex flex-col h-full p-5 sm:p-6">
      {/* Icon container */}
      <div className="mb-4">
        <div
          className={cn(
            "inline-flex items-center justify-center",
            "w-12 h-12 sm:w-14 sm:h-14 rounded-xl",
            "bg-gradient-to-br from-primary/10 to-primary/5",
            "border border-primary/10",
            "transform-gpu transition-all duration-300 ease-out",
            "group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20",
            "group-hover:border-primary/20",
          )}
        >
          <Icon
            className={cn(
              "w-6 h-6 sm:w-7 sm:h-7",
              "text-primary",
              "transition-transform duration-300",
              "group-hover:scale-110",
            )}
          />
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 flex flex-col">
        <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-2 transition-all duration-300 lg:group-hover:-translate-y-8">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            {name}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      </div>

      {/* CTA - Mobile (always visible) */}
      <div className="mt-4 lg:hidden">
        <Button
          variant="ghost"
          asChild
          size="sm"
          className="p-0 h-auto font-medium text-primary hover:text-primary/80 hover:bg-transparent"
        >
          <a href={href} className="inline-flex items-center gap-2">
            {cta}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </Button>
      </div>

      {/* CTA - Desktop (appears on hover) */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 right-0",
          "hidden lg:flex",
          "p-5 sm:p-6",
          "translate-y-full opacity-0",
          "transform-gpu transition-all duration-300 ease-out",
          "group-hover:translate-y-0 group-hover:opacity-100",
        )}
      >
        <Button
          variant="default"
          asChild
          size="sm"
          className="pointer-events-auto shadow-lg"
        >
          <a href={href} className="inline-flex items-center gap-2">
            {cta}
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>

    {/* Hover overlay */}
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        "bg-gradient-to-t from-background/80 via-transparent to-transparent",
        "opacity-0 transition-opacity duration-300",
        "group-hover:opacity-100",
      )}
    />

    {/* Featured indicator glow */}
    {featured && (
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />
    )}
  </div>
);

export { BentoCard, BentoGrid };
