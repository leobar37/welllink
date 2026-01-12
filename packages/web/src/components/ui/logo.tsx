import { cn } from "@/lib/utils";
import { LogoIcon } from "./logo-icon";
import { Logotype } from "./logotype";

export { LogoIcon, Logotype };

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoVariant = "icon-only" | "text-only" | "full";

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
}

const iconSizeConfig: Record<LogoSize, "sm" | "md" | "lg" | "xl"> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

const typeSizeConfig: Record<LogoSize, "sm" | "md" | "lg" | "xl"> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

export function Logo({
  size = "md",
  variant = "full",
  className,
}: LogoProps) {
  if (variant === "icon-only") {
    return (
      <LogoIcon
        size={iconSizeConfig[size]}
        className={className}
      />
    );
  }

  if (variant === "text-only") {
    return (
      <Logotype
        size={typeSizeConfig[size]}
        className={className}
      />
    );
  }

  // Full variant: icon + text
  const gap = size === "sm" ? "gap-1.5" : size === "md" ? "gap-2" : "gap-3";

  return (
    <div className={cn("flex items-center", gap, className)}>
      <LogoIcon size={iconSizeConfig[size]} />
      <Logotype size={typeSizeConfig[size]} />
    </div>
  );
}
