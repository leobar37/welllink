import { cn } from "@/lib/utils";

interface LogoCitaBotProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "icon-only" | "text-only" | "full";
  className?: string;
}

const sizeConfig = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

const textSizeConfig: Record<string, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

/**
 * Logo Icon - Simple calendar with checkmark/chat indicator
 * Uses currentColor to adapt to theme (light/dark mode)
 */
function LogoIcon({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const dimension = sizeConfig[size];

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      {/* Background circle */}
      <circle
        cx="32"
        cy="32"
        r="30"
        className="fill-primary/10"
      />

      {/* Calendar base */}
      <rect
        x="14"
        y="18"
        width="36"
        height="32"
        rx="4"
        className="fill-primary"
      />

      {/* Calendar top bar */}
      <rect
        x="14"
        y="18"
        width="36"
        height="10"
        rx="4"
        className="fill-primary/80"
      />

      {/* Calendar dots (dates) */}
      <circle cx="22" cy="36" r="2" className="fill-primary-foreground/80" />
      <circle cx="32" cy="36" r="2" className="fill-primary-foreground/80" />
      <circle cx="42" cy="36" r="2" className="fill-primary-foreground/80" />
      <circle cx="22" cy="44" r="2" className="fill-primary-foreground/80" />

      {/* Checkmark overlay */}
      <circle cx="46" cy="46" r="10" className="fill-background" />
      <circle cx="46" cy="46" r="8" className="fill-primary" />
      <path
        d="M42 46L45 49L50 43"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary-foreground"
      />
    </svg>
  );
}

/**
 * Logotype - CitaBot text
 */
function Logotype({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  return (
    <span
      className={cn(
        "font-bold tracking-tight whitespace-nowrap",
        textSizeConfig[size],
        className
      )}
    >
      <span className="text-foreground">Cita</span>
      <span className="text-primary">Bot</span>
    </span>
  );
}

/**
 * Logo CitaBot - Reusable logo component
 * Supports icon-only, text-only, or full (icon + text) variants
 * Automatically adapts to light/dark mode via CSS variables
 */
export function LogoCitaBot({
  size = "md",
  variant = "full",
  className,
}: LogoCitaBotProps) {
  if (variant === "icon-only") {
    return <LogoIcon size={size} className={className} />;
  }

  if (variant === "text-only") {
    return <Logotype size={size} className={className} />;
  }

  // Full variant: icon + text
  const gap = size === "sm" ? "gap-1.5" : size === "md" ? "gap-2" : "gap-3";

  return (
    <div className={cn("flex items-center", gap, className)}>
      <LogoIcon size={size} />
      <Logotype size={size} />
    </div>
  );
}

// Re-export individual components for flexibility
export { LogoIcon, Logotype };
