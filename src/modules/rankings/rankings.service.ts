import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HubTier } from '@prisma/client';

interface HubRankingCriteria {
  totalDeliveries: number;
  rating: number;
  successRate: number;
  reviewCount: number;
}

@Injectable()
export class RankingsService {
  private readonly logger = new Logger(RankingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate hub tier based on performance metrics
   * Similar to Airbnb Super Host system
   *
   * Tier Requirements:
   * - SUPER_HUB: 500+ deliveries, 4.8+ rating, 95%+ success rate, 100+ reviews
   * - TOP_HUB: 200+ deliveries, 4.5+ rating, 90%+ success rate, 50+ reviews
   * - ACTIVE_HUB: 50+ deliveries, 4.0+ rating, 85%+ success rate, 10+ reviews
   * - NEW_HUB: Less than above criteria
   */
  private calculateHubTier(criteria: HubRankingCriteria): HubTier {
    const { totalDeliveries, rating, successRate, reviewCount } = criteria;

    if (
      totalDeliveries >= 500 &&
      rating >= 4.8 &&
      successRate >= 95 &&
      reviewCount >= 100
    ) {
      return HubTier.SUPER_HUB;
    }

    if (
      totalDeliveries >= 200 &&
      rating >= 4.5 &&
      successRate >= 90 &&
      reviewCount >= 50
    ) {
      return HubTier.TOP_HUB;
    }

    if (
      totalDeliveries >= 50 &&
      rating >= 4.0 &&
      successRate >= 85 &&
      reviewCount >= 10
    ) {
      return HubTier.ACTIVE_HUB;
    }

    return HubTier.NEW_HUB;
  }

  async updateHubTier(hubId: string) {
    const hub = await this.prisma.hub.findUnique({
      where: { id: hubId },
      include: {
        _count: {
          select: {
            reviews: true,
            deliveries: true,
            packages: true,
          },
        },
      },
    });

    if (!hub) {
      throw new Error('Hub not found');
    }

    // Get total deliveries count
    const totalDeliveries = hub.totalDeliveries;

    // Get successful deliveries count
    const successfulDeliveries = await this.prisma.delivery.count({
      where: {
        hubId,
        status: 'COMPLETED',
      },
    });

    // Calculate success rate
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    // Get review count and average rating
    const reviewCount = hub._count.reviews;
    const rating = Number(hub.rating);

    // Calculate tier
    const newTier = this.calculateHubTier({
      totalDeliveries,
      rating,
      successRate,
      reviewCount,
    });

    // Update hub tier if changed
    if (hub.tier !== newTier) {
      await this.prisma.hub.update({
        where: { id: hubId },
        data: { tier: newTier },
      });

      this.logger.log(
        `Hub ${hub.name} (ID: ${hubId}) tier updated: ${hub.tier} -> ${newTier}`,
      );
    }

    return {
      hubId,
      hubName: hub.name,
      previousTier: hub.tier,
      newTier,
      metrics: {
        totalDeliveries,
        successfulDeliveries,
        successRate: successRate.toFixed(2),
        rating,
        reviewCount,
      },
    };
  }

  async getLeaderboard(limit: number = 50) {
    const hubs = await this.prisma.hub.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [
        { rating: 'desc' },
        { totalDeliveries: 'desc' },
      ],
      take: limit,
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            deliveries: true,
            packages: true,
          },
        },
      },
    });

    // Calculate success rate for each hub
    const leaderboardWithStats = await Promise.all(
      hubs.map(async (hub, index) => {
        const successfulDeliveries = await this.prisma.delivery.count({
          where: {
            hubId: hub.id,
            status: 'COMPLETED',
          },
        });

        const successRate =
          hub.totalDeliveries > 0
            ? ((successfulDeliveries / hub.totalDeliveries) * 100).toFixed(2)
            : '0.00';

        return {
          rank: index + 1,
          id: hub.id,
          name: hub.name,
          address: hub.address,
          tier: hub.tier,
          rating: Number(hub.rating),
          totalDeliveries: hub.totalDeliveries,
          successRate,
          reviewCount: hub._count.reviews,
          capacity: hub.capacity,
          host: hub.host,
        };
      }),
    );

    return {
      totalHubs: leaderboardWithStats.length,
      leaderboard: leaderboardWithStats,
    };
  }

  async getLeaderboardByTier(tier: HubTier, limit: number = 50) {
    const hubs = await this.prisma.hub.findMany({
      where: {
        status: 'ACTIVE',
        tier,
      },
      orderBy: [
        { rating: 'desc' },
        { totalDeliveries: 'desc' },
      ],
      take: limit,
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            deliveries: true,
          },
        },
      },
    });

    const leaderboardWithStats = await Promise.all(
      hubs.map(async (hub, index) => {
        const successfulDeliveries = await this.prisma.delivery.count({
          where: {
            hubId: hub.id,
            status: 'COMPLETED',
          },
        });

        const successRate =
          hub.totalDeliveries > 0
            ? ((successfulDeliveries / hub.totalDeliveries) * 100).toFixed(2)
            : '0.00';

        return {
          rank: index + 1,
          id: hub.id,
          name: hub.name,
          address: hub.address,
          tier: hub.tier,
          rating: Number(hub.rating),
          totalDeliveries: hub.totalDeliveries,
          successRate,
          reviewCount: hub._count.reviews,
          host: hub.host,
        };
      }),
    );

    return {
      tier,
      totalHubs: leaderboardWithStats.length,
      leaderboard: leaderboardWithStats,
    };
  }

  async getHubRank(hubId: string) {
    const hub = await this.prisma.hub.findUnique({
      where: { id: hubId },
      include: {
        _count: {
          select: {
            reviews: true,
            deliveries: true,
          },
        },
      },
    });

    if (!hub) {
      throw new Error('Hub not found');
    }

    // Get all active hubs with better or equal rating
    const betterRankedHubs = await this.prisma.hub.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { rating: { gt: hub.rating } },
          {
            rating: hub.rating,
            totalDeliveries: { gt: hub.totalDeliveries },
          },
        ],
      },
    });

    const rank = betterRankedHubs + 1;

    // Get success rate
    const successfulDeliveries = await this.prisma.delivery.count({
      where: {
        hubId,
        status: 'COMPLETED',
      },
    });

    const successRate =
      hub.totalDeliveries > 0
        ? ((successfulDeliveries / hub.totalDeliveries) * 100).toFixed(2)
        : '0.00';

    return {
      hub: {
        id: hub.id,
        name: hub.name,
        address: hub.address,
        tier: hub.tier,
        rating: Number(hub.rating),
      },
      ranking: {
        rank,
        tier: hub.tier,
        totalDeliveries: hub.totalDeliveries,
        successRate,
        reviewCount: hub._count.reviews,
      },
      tierRequirements: this.getTierRequirements(),
      nextTier: this.getNextTierRequirements(hub.tier),
    };
  }

  private getTierRequirements() {
    return {
      SUPER_HUB: {
        minDeliveries: 500,
        minRating: 4.8,
        minSuccessRate: 95,
        minReviews: 100,
      },
      TOP_HUB: {
        minDeliveries: 200,
        minRating: 4.5,
        minSuccessRate: 90,
        minReviews: 50,
      },
      ACTIVE_HUB: {
        minDeliveries: 50,
        minRating: 4.0,
        minSuccessRate: 85,
        minReviews: 10,
      },
      NEW_HUB: {
        minDeliveries: 0,
        minRating: 0,
        minSuccessRate: 0,
        minReviews: 0,
      },
    };
  }

  private getNextTierRequirements(currentTier: HubTier) {
    const tierOrder = [HubTier.NEW_HUB, HubTier.ACTIVE_HUB, HubTier.TOP_HUB, HubTier.SUPER_HUB];
    const currentIndex = tierOrder.indexOf(currentTier);

    if (currentIndex === tierOrder.length - 1) {
      return null; // Already at highest tier
    }

    const nextTier = tierOrder[currentIndex + 1];
    const requirements = this.getTierRequirements();

    return {
      tier: nextTier,
      requirements: requirements[nextTier],
    };
  }

  async updateAllHubTiers() {
    const hubs = await this.prisma.hub.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    const results = await Promise.all(
      hubs.map((hub) => this.updateHubTier(hub.id)),
    );

    const tierChanges = results.filter((r) => r.previousTier !== r.newTier);

    this.logger.log(
      `Updated tiers for ${hubs.length} hubs. ${tierChanges.length} tier changes.`,
    );

    return {
      totalHubsProcessed: hubs.length,
      tierChanges: tierChanges.length,
      changes: tierChanges,
    };
  }
}
