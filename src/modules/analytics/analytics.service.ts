import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AnalyticsQueryDto,
  DashboardStatsDto,
  DeliveryTrendsDto,
  HubPerformanceDto,
  GeographicDistributionDto,
  PackageStatusDistributionDto,
  RevenueAnalyticsDto,
  TimeSeriesDataPoint,
  TimePeriod,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(query: AnalyticsQueryDto): Promise<DashboardStatsDto> {
    this.logger.log('Getting dashboard stats');

    const { startDate, endDate } = this.getDateRange(query);

    const [
      totalHubs,
      totalPackages,
      totalDeliveries,
      successfulDeliveries,
      activePackages,
      deliveriesToday,
      avgDeliveryTimeResult,
      totalEarningsResult,
    ] = await Promise.all([
      // Total active hubs
      this.prisma.hub.count({
        where: { status: 'ACTIVE' },
      }),

      // Total packages
      this.prisma.package.count({
        where: {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        },
      }),

      // Total deliveries
      this.prisma.delivery.count({
        where: {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        },
      }),

      // Successful deliveries
      this.prisma.delivery.count({
        where: {
          status: 'DELIVERED',
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        },
      }),

      // Active packages (not delivered or failed)
      this.prisma.package.count({
        where: {
          status: {
            notIn: ['DELIVERED', 'FAILED', 'RETURNED'],
          },
        },
      }),

      // Deliveries today
      this.prisma.delivery.count({
        where: {
          deliveredAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          status: 'DELIVERED',
        },
      }),

      // Average delivery time
      this.prisma.$queryRaw<Array<{ avg: number }>>`
        SELECT AVG(EXTRACT(EPOCH FROM (delivered_at - created_at)) / 3600) as avg
        FROM "deliveries"
        WHERE status = 'DELIVERED'
          AND delivered_at IS NOT NULL
          AND created_at >= ${new Date(startDate)}
          AND created_at <= ${new Date(endDate)}
      `,

      // Total earnings (simulated - would come from earnings table)
      this.calculateTotalEarnings(startDate, endDate),
    ]);

    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;
    const avgDeliveryTime = avgDeliveryTimeResult[0]?.avg || 0;

    // Calculate growth rate (compare to previous period)
    const growthRate = await this.calculateGrowthRate(query);

    return {
      totalHubs,
      totalPackages,
      totalDeliveries,
      successRate: Number(successRate.toFixed(2)),
      avgDeliveryTime: Number(avgDeliveryTime.toFixed(2)),
      totalEarnings: totalEarningsResult,
      activePackages,
      deliveriesToday,
      growthRate: Number(growthRate.toFixed(2)),
    };
  }

  /**
   * Get delivery trends over time
   */
  async getDeliveryTrends(query: AnalyticsQueryDto): Promise<DeliveryTrendsDto> {
    this.logger.log('Getting delivery trends');

    const { startDate, endDate } = this.getDateRange(query);
    const interval = this.getTimeInterval(query.period || TimePeriod.MONTH);

    // Get daily delivery counts
    const deliveries = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE_TRUNC(${interval}, created_at) as date, COUNT(*) as count
      FROM "deliveries"
      WHERE created_at >= ${new Date(startDate)} AND created_at <= ${new Date(endDate)}
      GROUP BY DATE_TRUNC(${interval}, created_at)
      ORDER BY date ASC
    `;

    // Get daily package counts
    const packages = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE_TRUNC(${interval}, created_at) as date, COUNT(*) as count
      FROM "packages"
      WHERE created_at >= ${new Date(startDate)} AND created_at <= ${new Date(endDate)}
      GROUP BY DATE_TRUNC(${interval}, created_at)
      ORDER BY date ASC
    `;

    // Calculate success rate over time
    const successRateData = await this.prisma.$queryRaw<
      Array<{ date: Date; total: bigint; successful: bigint }>
    >`
      SELECT
        DATE_TRUNC(${interval}, created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as successful
      FROM "deliveries"
      WHERE created_at >= ${new Date(startDate)} AND created_at <= ${new Date(endDate)}
      GROUP BY DATE_TRUNC(${interval}, created_at)
      ORDER BY date ASC
    `;

    return {
      deliveries: deliveries.map((d) => ({
        date: d.date.toISOString(),
        value: Number(d.count),
      })),
      packages: packages.map((p) => ({
        date: p.date.toISOString(),
        value: Number(p.count),
      })),
      successRate: successRateData.map((s) => ({
        date: s.date.toISOString(),
        value: Number(s.total) > 0 ? (Number(s.successful) / Number(s.total)) * 100 : 0,
      })),
    };
  }

  /**
   * Get hub performance metrics
   */
  async getHubPerformance(query: AnalyticsQueryDto): Promise<HubPerformanceDto[]> {
    this.logger.log('Getting hub performance metrics');

    const { startDate, endDate } = this.getDateRange(query);

    const whereClause = query.hubId ? { hubId: query.hubId } : {};

    const hubs = await this.prisma.hub.findMany({
      where: {
        status: 'ACTIVE',
        ...whereClause,
      },
      include: {
        deliveries: {
          where: {
            createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
          },
        },
      },
    });

    const performance: HubPerformanceDto[] = await Promise.all(
      hubs.map(async (hub) => {
        const totalDeliveries = hub.deliveries.length;
        const successfulDeliveries = hub.deliveries.filter((d) => d.status === 'DELIVERED').length;
        const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

        // Calculate average delivery time
        const deliveredPackages = hub.deliveries.filter(
          (d) => d.status === 'DELIVERED' && d.deliveredAt,
        );
        const avgDeliveryTime =
          deliveredPackages.length > 0
            ? deliveredPackages.reduce((sum, d) => {
                const hours =
                  (d.deliveredAt!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
                return sum + hours;
              }, 0) / deliveredPackages.length
            : 0;

        // Get earnings for this hub
        const earnings = await this.getHubEarnings(hub.id, startDate, endDate);

        return {
          hubId: hub.id,
          hubName: hub.name,
          totalDeliveries,
          successfulDeliveries,
          successRate: Number(successRate.toFixed(2)),
          avgDeliveryTime: Number(avgDeliveryTime.toFixed(2)),
          rating: Number(hub.rating),
          totalEarnings: earnings,
        };
      }),
    );

    return performance.sort((a, b) => b.totalDeliveries - a.totalDeliveries);
  }

  /**
   * Get geographic distribution of hubs and deliveries
   */
  async getGeographicDistribution(): Promise<GeographicDistributionDto[]> {
    this.logger.log('Getting geographic distribution');

    const hubs = await this.prisma.hub.findMany({
      where: { status: 'ACTIVE' },
      include: {
        deliveries: true,
      },
    });

    // Group by city
    const distribution = new Map<string, GeographicDistributionDto>();

    hubs.forEach((hub) => {
      const location = hub.city || 'Unknown';
      if (!distribution.has(location)) {
        distribution.set(location, {
          location,
          hubCount: 0,
          deliveryCount: 0,
          latitude: hub.latitude ? Number(hub.latitude) : undefined,
          longitude: hub.longitude ? Number(hub.longitude) : undefined,
        });
      }

      const data = distribution.get(location)!;
      data.hubCount++;
      data.deliveryCount += hub.deliveries.length;
    });

    return Array.from(distribution.values()).sort((a, b) => b.hubCount - a.hubCount);
  }

  /**
   * Get package status distribution
   */
  async getPackageStatusDistribution(query: AnalyticsQueryDto): Promise<PackageStatusDistributionDto[]> {
    this.logger.log('Getting package status distribution');

    const { startDate, endDate } = this.getDateRange(query);

    const statusCounts = await this.prisma.package.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      _count: true,
    });

    const total = statusCounts.reduce((sum, item) => sum + item._count, 0);

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count,
      percentage: total > 0 ? Number(((item._count / total) * 100).toFixed(2)) : 0,
    }));
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(query: AnalyticsQueryDto): Promise<RevenueAnalyticsDto> {
    this.logger.log('Getting revenue analytics');

    const { startDate, endDate } = this.getDateRange(query);
    const interval = this.getTimeInterval(query.period || TimePeriod.MONTH);

    const totalRevenue = await this.calculateTotalEarnings(startDate, endDate);

    // Revenue over time (simulated)
    const deliveries = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE_TRUNC(${interval}, delivered_at) as date, COUNT(*) as count
      FROM "deliveries"
      WHERE status = 'DELIVERED'
        AND delivered_at >= ${new Date(startDate)}
        AND delivered_at <= ${new Date(endDate)}
      GROUP BY DATE_TRUNC(${interval}, delivered_at)
      ORDER BY date ASC
    `;

    const revenueOverTime: TimeSeriesDataPoint[] = deliveries.map((d) => ({
      date: d.date.toISOString(),
      value: Number(d.count) * 300, // $3 per delivery (simulated)
    }));

    // Revenue by hub
    const hubs = await this.prisma.hub.findMany({
      where: { status: 'ACTIVE' },
    });

    const revenueByHub: Record<string, number> = {};
    for (const hub of hubs) {
      revenueByHub[hub.name] = await this.getHubEarnings(hub.id, startDate, endDate);
    }

    const totalDeliveries = await this.prisma.delivery.count({
      where: {
        status: 'DELIVERED',
        deliveredAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
    });

    const avgRevenuePerDelivery = totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0;

    const growthRate = await this.calculateRevenueGrowthRate(query);

    return {
      totalRevenue,
      revenueOverTime,
      revenueByHub,
      avgRevenuePerDelivery: Number(avgRevenuePerDelivery.toFixed(0)),
      growthRate: Number(growthRate.toFixed(2)),
    };
  }

  // Helper methods

  private getDateRange(query: AnalyticsQueryDto): { startDate: string; endDate: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (query.period === TimePeriod.CUSTOM && query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      switch (query.period) {
        case TimePeriod.DAY:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case TimePeriod.WEEK:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case TimePeriod.YEAR:
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case TimePeriod.MONTH:
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  private getTimeInterval(period: TimePeriod): string {
    switch (period) {
      case TimePeriod.DAY:
        return 'hour';
      case TimePeriod.WEEK:
        return 'day';
      case TimePeriod.MONTH:
        return 'day';
      case TimePeriod.YEAR:
        return 'month';
      default:
        return 'day';
    }
  }

  private async calculateTotalEarnings(startDate: string, endDate: string): Promise<number> {
    // Simulated: $3 per delivery
    const deliveries = await this.prisma.delivery.count({
      where: {
        status: 'DELIVERED',
        deliveredAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
    });

    return deliveries * 300; // 300 cents = $3
  }

  private async getHubEarnings(hubId: string, startDate: string, endDate: string): Promise<number> {
    const deliveries = await this.prisma.delivery.count({
      where: {
        hubId,
        status: 'DELIVERED',
        deliveredAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
    });

    return deliveries * 300; // 300 cents = $3
  }

  private async calculateGrowthRate(query: AnalyticsQueryDto): Promise<number> {
    const { startDate, endDate } = this.getDateRange(query);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end.getTime() - start.getTime();

    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = start;

    const [currentPeriod, previousPeriod] = await Promise.all([
      this.prisma.delivery.count({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: start, lte: end },
        },
      }),
      this.prisma.delivery.count({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: previousStart, lte: previousEnd },
        },
      }),
    ]);

    if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;

    return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  }

  private async calculateRevenueGrowthRate(query: AnalyticsQueryDto): Promise<number> {
    // Similar to calculateGrowthRate but for revenue
    return this.calculateGrowthRate(query); // Simplified for now
  }
}
