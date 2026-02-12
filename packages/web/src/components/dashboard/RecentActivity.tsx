import { Eye, MousePointerClick } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useRecentActivity } from "@/hooks/use-recent-activity";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RecentActivityProps {
  profileId: string;
}

const sourceLabels: Record<string, string> = {
  qr: "QR",
  direct_link: "Link directo",
  referral: "Referencia",
};

const platformLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
};

export function RecentActivity({ profileId }: RecentActivityProps) {
  const { data: activities, isLoading } = useRecentActivity(profileId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
          <Eye className="h-5 w-5 opacity-50" />
        </div>
        <p className="text-sm">No hay actividad reciente</p>
        <p className="text-xs opacity-60 mt-1">Los visitantes aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={`${activity.type}-${activity.timestamp.getTime()}-${index}`}
          className="flex items-start gap-3"
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              activity.type === "view"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
            )}
          >
            {activity.type === "view" ? (
              <Eye className="h-5 w-5" />
            ) : (
              <MousePointerClick className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {activity.type === "view"
                  ? "Vista al perfil"
                  : `Clic en ${platformLabels[activity.platform || ""] || activity.platform}`}
              </p>
              {activity.type === "view" && activity.source && (
                <Badge variant="secondary" className="text-xs">
                  {sourceLabels[activity.source] || activity.source}
                </Badge>
              )}
              {activity.type === "click" && activity.platform && (
                <Badge variant="secondary" className="text-xs">
                  {platformLabels[activity.platform] || activity.platform}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(activity.timestamp, {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
