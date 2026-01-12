import { cn } from "@/lib/utils";

type LogotypeSize = "sm" | "md" | "lg" | "xl";

interface LogotypeProps {
  size?: LogotypeSize;
  className?: string;
}

const sizeConfig: Record<LogotypeSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export function Logotype({ size = "md", className }: LogotypeProps) {
  const textSize = sizeConfig[size];

  return (
    <span
      className={cn(
        "font-bold tracking-tight whitespace-nowrap",
        textSize,
        className
      )}
    >
      <span className="text-foreground">Well</span>
      <span className="text-primary">link</span>
    </span>
  );
}
