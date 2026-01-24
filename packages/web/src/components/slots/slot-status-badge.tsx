import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  AlertCircle,
  Calendar,
} from "lucide-react";

const slotStatusVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200",
  {
    variants: {
      variant: {
        available:
          "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
        reserved:
          "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
        blocked:
          "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
        pending_approval:
          "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
        cancelled:
          "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800",
        expired:
          "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-500 dark:border-slate-800",
      },
    },
    defaultVariants: {
      variant: "available",
    },
  },
);

const statusIcons = {
  available: CheckCircle2,
  reserved: Calendar,
  blocked: XCircle,
  pending_approval: Clock,
  cancelled: AlertCircle,
  expired: Ban,
};

const statusLabels = {
  available: "Disponible",
  reserved: "Reservado",
  blocked: "Bloqueado",
  pending_approval: "Pendiente",
  cancelled: "Cancelado",
  expired: "Expirado",
};

interface SlotStatusBadgeProps extends VariantProps<typeof slotStatusVariants> {
  className?: string;
  showIcon?: boolean;
  customLabel?: string;
}

export function SlotStatusBadge({
  variant = "available",
  className,
  showIcon = true,
  customLabel,
}: SlotStatusBadgeProps) {
  const Icon = statusIcons[variant as keyof typeof statusIcons] || Clock;
  const label =
    customLabel ||
    statusLabels[variant as keyof typeof statusLabels] ||
    variant;

  return (
    <span className={cn(slotStatusVariants({ variant }), className)}>
      {showIcon && <Icon className="size-3.5" />}
      <span>{label}</span>
    </span>
  );
}

// Compact version for timeline views
interface SlotStatusDotProps {
  variant?:
    | "available"
    | "reserved"
    | "blocked"
    | "pending_approval"
    | "cancelled"
    | "expired";
  className?: string;
}

export function SlotStatusDot({
  variant = "available",
  className,
}: SlotStatusDotProps) {
  const colorClasses = {
    available: "bg-emerald-500",
    reserved: "bg-amber-500",
    blocked: "bg-red-500",
    pending_approval: "bg-blue-500",
    cancelled: "bg-slate-400",
    expired: "bg-slate-300",
  };

  return (
    <span
      className={cn(
        "size-2.5 rounded-full",
        colorClasses[variant as keyof typeof colorClasses] || "bg-slate-400",
        className,
      )}
    />
  );
}

// Large version for header/banners
interface SlotStatusBannerProps {
  variant?:
    | "available"
    | "reserved"
    | "blocked"
    | "pending_approval"
    | "cancelled"
    | "expired";
  className?: string;
  count?: number;
}

export function SlotStatusBanner({
  variant = "available",
  className,
  count,
}: SlotStatusBannerProps) {
  const Icon = statusIcons[variant as keyof typeof statusIcons] || Clock;
  const label = statusLabels[variant as keyof typeof statusLabels] || variant;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 px-4 py-2 rounded-lg border",
        variant === "available" &&
          "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-200",
        variant === "reserved" &&
          "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200",
        variant === "blocked" &&
          "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-200",
        className,
      )}
    >
      <Icon className="size-5" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{label}</span>
        {count !== undefined && (
          <span className="text-xs opacity-75">
            {count} {count === 1 ? "slot" : "slots"}
          </span>
        )}
      </div>
    </div>
  );
}
