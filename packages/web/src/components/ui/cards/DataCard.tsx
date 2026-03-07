import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function DataCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
}: DataCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
            {trend && (
              <span
                className={cn(
                  "text-xs mt-2 inline-flex items-center",
                  trend.isPositive ? "text-primary" : "text-destructive",
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {icon && <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
