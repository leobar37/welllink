import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoColor = "primary" | "white" | "dark";

interface LogoProps {
  size?: LogoSize;
  color?: LogoColor;
  className?: string;
}

const sizeConfig: Record<LogoSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
};

const colorConfig: Record<LogoColor, { well: string; link: string }> = {
  primary: { well: "text-foreground", link: "text-primary" },
  white: { well: "text-white", link: "text-white/80" },
  dark: { well: "text-foreground", link: "text-primary" },
};

export function Logo({ size = "md", color = "primary", className }: LogoProps) {
  const textSize = sizeConfig[size];
  const colors = colorConfig[color];

  return (
    <span className={cn("font-semibold tracking-tight", textSize, className)}>
      <span className={colors.well}>Well</span>
      <span className={colors.link}>link</span>
    </span>
  );
}
