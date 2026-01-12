import { cn } from "@/lib/utils";

interface LogoIconProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeConfig = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export function LogoIcon({ size = "md", className }: LogoIconProps) {
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
      {/* Abstract medical cross + link nodes */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" className="text-primary" />
          <stop offset="100%" stopColor="currentColor" className="text-primary/60" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="currentColor"
        className="text-primary/10"
      />

      {/* Medical cross - horizontal */}
      <rect
        x="16"
        y="28"
        width="32"
        height="8"
        rx="2"
        fill="currentColor"
        className="text-primary"
      />

      {/* Medical cross - vertical */}
      <rect
        x="28"
        y="16"
        width="8"
        height="32"
        rx="2"
        fill="currentColor"
        className="text-primary"
      />

      {/* Connection nodes (links) */}
      <circle cx="32" cy="32" r="6" fill="currentColor" className="text-background" />
      <circle cx="32" cy="32" r="3" fill="currentColor" className="text-primary" />

      {/* Small link indicator dots */}
      <circle cx="52" cy="18" r="3" fill="currentColor" className="text-primary/60" />
      <circle cx="12" cy="46" r="3" fill="currentColor" className="text-primary/60" />
      <circle cx="52" cy="46" r="3" fill="currentColor" className="text-primary/60" />
    </svg>
  );
}
