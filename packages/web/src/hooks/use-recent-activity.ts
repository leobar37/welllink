import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface RecentActivityItem {
  type: "view" | "click";
  timestamp: Date;
  source?: string;
  platform?: string;
  metadata?: Record<string, unknown>;
}

export function useRecentActivity(profileId?: string, limit: number = 15) {
  return useQuery({
    queryKey: ["recent-activity", profileId, limit],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await api.api.analytics.profiles[profileId][
        "recent-activity"
      ].get({
        $query: { limit: limit.toString() },
      });
      if (error) throw error;
      return (data as unknown as RecentActivityItem[]).map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    },
    enabled: !!profileId,
  });
}
