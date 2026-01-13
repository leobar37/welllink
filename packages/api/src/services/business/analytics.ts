import type { RequestContext } from "../../types/context";
import { AnalyticsRepository } from "../repository/analytics";
import { startOfDay, endOfDay, subDays } from "date-fns";

type ViewSource = "qr" | "direct_link" | "referral";

export interface RecentActivityItem {
  type: "view" | "click";
  timestamp: Date;
  source?: string;
  platform?: string;
  metadata?: any;
}

export class AnalyticsService {
  constructor(private analyticsRepository: AnalyticsRepository) {}

  async getProfileViews(ctx: RequestContext, profileId: string) {
    return this.analyticsRepository.getProfileViews(ctx, profileId);
  }

  async getProfileViewStats(
    ctx: RequestContext,
    profileId: string,
    days: number = 30,
  ) {
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const [views, totalCount] = await Promise.all([
      this.analyticsRepository.getProfileViewsByDateRange(
        ctx,
        profileId,
        startDate,
        endDate,
      ),
      this.analyticsRepository.getProfileViewsCount(ctx, profileId),
    ]);

    // Group views by day
    const dailyViews = views.reduce((acc: Record<string, number>, view) => {
      if (!view.viewedAt) return acc;
      const date = view.viewedAt.toISOString().split("T")[0];
      if (!date) return acc;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {});

    // Group views by source
    const viewsBySource = views.reduce((acc: Record<string, number>, view) => {
      const source = view.source || "unknown";
      if (!acc[source]) {
        acc[source] = 0;
      }
      acc[source]++;
      return acc;
    }, {});

    return {
      totalViews: totalCount,
      periodViews: views.length,
      dailyViews,
      viewsBySource,
      period: { days, startDate, endDate },
    };
  }

  async getSocialClickStats(
    ctx: RequestContext,
    profileId: string,
    days: number = 30,
  ) {
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const [allClicks, recentClicks, clicksByPlatform] = await Promise.all([
      this.analyticsRepository.getSocialClicks(ctx, profileId),
      this.analyticsRepository.getSocialClicksByDateRange(
        ctx,
        profileId,
        startDate,
        endDate,
      ),
      this.getClicksByPlatform(ctx, profileId),
    ]);

    // Group recent clicks by day
    const dailyClicks = recentClicks.reduce(
      (acc: Record<string, number>, click) => {
        if (!click.clickedAt) return acc;
        const date = click.clickedAt.toISOString().split("T")[0];
        if (!date) return acc;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;
        return acc;
      },
      {},
    );

    // Group recent clicks by platform (via socialLink relation)
    const recentClicksByPlatform = recentClicks.reduce(
      (acc: Record<string, number>, click) => {
        const platform = click.socialLink.platform;
        if (!acc[platform]) {
          acc[platform] = 0;
        }
        acc[platform]++;
        return acc;
      },
      {},
    );

    return {
      totalClicks: allClicks.length,
      periodClicks: recentClicks.length,
      dailyClicks,
      clicksByPlatform,
      recentClicksByPlatform,
      period: { days, startDate, endDate },
    };
  }

  async getOverallStats(
    ctx: RequestContext,
    profileId: string,
    days: number = 30,
  ) {
    const [viewStats, clickStats] = await Promise.all([
      this.getProfileViewStats(ctx, profileId, days),
      this.getSocialClickStats(ctx, profileId, days),
    ]);

    // Calculate click-through rate
    const ctr =
      viewStats.periodViews > 0
        ? (clickStats.periodClicks / viewStats.periodViews) * 100
        : 0;

    return {
      views: viewStats,
      clicks: clickStats,
      ctr: Math.round(ctr * 100) / 100, // Round to 2 decimal places
      period: { days },
    };
  }

  async trackProfileView(
    profileId: string,
    source: ViewSource = "direct_link",
    userAgent?: string,
  ) {
    return this.analyticsRepository.createProfileView({
      profileId,
      source,
      userAgent: userAgent || null,
    });
  }

  async trackSocialClick(socialLinkId: string) {
    return this.analyticsRepository.createSocialClick({
      socialLinkId,
    });
  }

  private async getClicksByPlatform(ctx: RequestContext, profileId: string) {
    const clicks = await this.analyticsRepository.getSocialClicks(
      ctx,
      profileId,
    );

    return clicks.reduce((acc: Record<string, number>, click) => {
      const platform = click.socialLink.platform;
      if (!acc[platform]) {
        acc[platform] = 0;
      }
      acc[platform]++;
      return acc;
    }, {});
  }

  async getTrendingStats(
    ctx: RequestContext,
    profileId: string,
    days: number = 7,
  ) {
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const [views, clicks] = await Promise.all([
      this.analyticsRepository.getProfileViewsByDateRange(
        ctx,
        profileId,
        startDate,
        endDate,
      ),
      this.analyticsRepository.getSocialClicksByDateRange(
        ctx,
        profileId,
        startDate,
        endDate,
      ),
    ]);

    // Calculate daily averages
    const avgViewsPerDay = views.length / days;
    const avgClicksPerDay = clicks.length / days;

    // Find best performing day
    const viewsByDay = views.reduce(
      (acc: Record<string, { views: number; clicks: number }>, view) => {
        if (!view.viewedAt) return acc;
        const date = view.viewedAt.toISOString().split("T")[0];
        if (!date) return acc;
        if (!acc[date]) {
          acc[date] = { views: 0, clicks: 0 };
        }
        acc[date].views++;
        return acc;
      },
      {},
    );

    // Add clicks to the same structure
    clicks.forEach((click) => {
      if (!click.clickedAt) return;
      const date = click.clickedAt.toISOString().split("T")[0];
      if (!date) return;
      if (!viewsByDay[date]) {
        viewsByDay[date] = { views: 0, clicks: 0 };
      }
      viewsByDay[date].clicks++;
    });

    const bestDay = Object.entries(viewsByDay).reduce(
      (best, [date, stats]) => {
        if (!best || stats.views > best.stats.views) {
          return { date, stats };
        }
        return best;
      },
      null as { date: string; stats: { views: number; clicks: number } } | null,
    );

    return {
      avgViewsPerDay: Math.round(avgViewsPerDay * 100) / 100,
      avgClicksPerDay: Math.round(avgClicksPerDay * 100) / 100,
      bestDay,
      trend: {
        totalViews: views.length,
        totalClicks: clicks.length,
        dailyBreakdown: viewsByDay,
      },
      period: { days },
    };
  }

  async getQRStats(ctx: RequestContext, profileId: string, days: number = 30) {
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const [
      totalDownloads,
      downloadsByFormat,
      totalScans,
      trafficSources,
      recentDownloads,
    ] = await Promise.all([
      this.analyticsRepository.getQRDownloadsCount(ctx, profileId),
      this.analyticsRepository.getQRDownloadsByFormat(ctx, profileId),
      this.analyticsRepository.getQRScansCount(ctx, profileId),
      this.analyticsRepository.getQRScansVsDirectLink(ctx, profileId),
      this.analyticsRepository.getQRDownloadsByDateRange(
        ctx,
        profileId,
        startDate,
        endDate,
      ),
    ]);

    // Group downloads by day
    const dailyDownloads = recentDownloads.reduce(
      (acc: Record<string, number>, download) => {
        if (!download.downloadedAt) return acc;
        const date = download.downloadedAt.toISOString().split("T")[0];
        if (!date) return acc;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;
        return acc;
      },
      {},
    );

    // Transform traffic sources to object
    const trafficBySource = trafficSources.reduce(
      (acc: Record<string, number>, source) => {
        acc[source.source] = source.count;
        return acc;
      },
      {},
    );

    // Transform downloads by format to object
    const downloadsByFormatObj = downloadsByFormat.reduce(
      (acc: Record<string, number>, item) => {
        acc[item.format] = item.count;
        return acc;
      },
      {},
    );

    // Calculate QR effectiveness (scans vs total profile views)
    const qrScans = trafficBySource["qr"] || 0;
    const directLinks = trafficBySource["direct_link"] || 0;
    const totalViews =
      qrScans + directLinks + (trafficBySource["referral"] || 0);
    const qrEffectiveness = totalViews > 0 ? (qrScans / totalViews) * 100 : 0;

    return {
      downloads: {
        total: totalDownloads,
        periodDownloads: recentDownloads.length,
        byFormat: downloadsByFormatObj,
        daily: dailyDownloads,
      },
      scans: {
        total: totalScans,
        fromQR: qrScans,
      },
      trafficSources: trafficBySource,
      qrEffectiveness: Math.round(qrEffectiveness * 100) / 100,
      period: { days, startDate, endDate },
    };
  }

  async getRecentActivity(
    ctx: RequestContext,
    profileId: string,
    limit: number = 15,
  ): Promise<RecentActivityItem[]> {
    const { views, clicks } = await this.analyticsRepository.getRecentActivity(
      ctx,
      profileId,
      limit,
    );

    // Transform views to activity items
    const viewItems: RecentActivityItem[] = views.map((view) => ({
      type: "view" as const,
      timestamp: view.viewedAt,
      source: view.source,
      metadata: {
        referrer: view.referrer,
        userAgent: view.userAgent,
      },
    }));

    // Transform clicks to activity items
    const clickItems: RecentActivityItem[] = clicks.map((click) => ({
      type: "click" as const,
      timestamp: click.clickedAt,
      platform: click.socialLink.platform,
      metadata: {
        socialLinkId: click.socialLinkId,
        url: `${click.socialLink.platform === "whatsapp" 
          ? `https://wa.me/${click.socialLink.username.replace(/\D/g, "")}`
          : click.socialLink.platform === "youtube"
          ? `https://youtube.com/@${click.socialLink.username}`
          : click.socialLink.platform === "tiktok"
          ? `https://tiktok.com/@${click.socialLink.username}`
          : `https://${click.socialLink.platform}.com/${click.socialLink.username}`
        }`,
      },
    }));

    // Combine and sort by timestamp descending
    const combined = [...viewItems, ...clickItems];
    combined.sort(
      (a: RecentActivityItem, b: RecentActivityItem) =>
        b.timestamp.getTime() - a.timestamp.getTime(),
    );

    // Return top limit items
    return combined.slice(0, limit);
  }
}
