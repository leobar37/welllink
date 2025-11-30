import type { RequestContext } from "../../types/context";
import { AnalyticsRepository } from "../repository/analytics";
import { startOfDay, endOfDay, subDays } from "date-fns";

type ViewSource = "qr" | "direct_link" | "referral";

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
}
