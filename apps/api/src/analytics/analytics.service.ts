import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string, days = 30) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!shop) return this.emptyDashboard();

    const since = new Date(Date.now() - days * 86400000);
    const shopId = shop.id;

    const [pageViews, blockClicks, topBlocks, orders, dailyViews] = await Promise.all([
      // Total page views in period
      this.prisma.analytics.count({
        where: { shopId, event: "PAGE_VIEW", createdAt: { gte: since } },
      }),
      // Total block clicks in period
      this.prisma.analytics.count({
        where: { shopId, event: "BLOCK_CLICK", createdAt: { gte: since } },
      }),
      // Top clicked blocks
      this.prisma.block.findMany({
        where: { shopId, clickCount: { gt: 0 } },
        orderBy: { clickCount: "desc" },
        take: 5,
        select: { id: true, type: true, label: true, url: true, clickCount: true },
      }),
      // Orders summary
      this.prisma.order.aggregate({
        where: { shopId, createdAt: { gte: since } },
        _count: { id: true },
        _sum: { totalPrice: true },
      }),
      // Daily views for chart (last `days` days)
      this.getDailyStats(shopId, since, "PAGE_VIEW"),
    ]);

    const allTimeViews = await this.prisma.analytics.count({
      where: { shopId, event: "PAGE_VIEW" },
    });

    return {
      period: days,
      pageViews,
      allTimeViews,
      blockClicks,
      clickRate: pageViews > 0 ? Math.round((blockClicks / pageViews) * 100) : 0,
      orders: {
        count: orders._count.id,
        revenue: Number(orders._sum.totalPrice || 0),
      },
      topBlocks,
      dailyViews,
    };
  }

  private async getDailyStats(shopId: string, since: Date, event: string) {
    const rows = await this.prisma.analytics.groupBy({
      by: ["createdAt"],
      where: { shopId, event, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });

    // Bucket into days
    const buckets: Record<string, number> = {};
    const now = new Date();
    const days = Math.ceil((now.getTime() - since.getTime()) / 86400000);

    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }

    for (const row of rows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      buckets[key] = (buckets[key] || 0) + row._count.id;
    }

    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }

  private emptyDashboard() {
    return {
      period: 30,
      pageViews: 0,
      allTimeViews: 0,
      blockClicks: 0,
      clickRate: 0,
      orders: { count: 0, revenue: 0 },
      topBlocks: [],
      dailyViews: [],
    };
  }

  async getReferers(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) return [];
    const rows = await this.prisma.analytics.groupBy({
      by: ["referer"],
      where: { shopId: shop.id, event: "PAGE_VIEW", referer: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });
    return rows.map((r) => ({ referer: r.referer || "مستقیم", count: r._count.id }));
  }
}
