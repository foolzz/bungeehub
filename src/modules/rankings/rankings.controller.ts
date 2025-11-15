import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HubTier } from '@prisma/client';

@ApiTags('rankings')
@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get hub leaderboard (top performing hubs)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of hubs to return',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns top performing hubs ranked by rating and deliveries',
    schema: {
      example: {
        totalHubs: 50,
        leaderboard: [
          {
            rank: 1,
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Downtown Hub',
            address: '123 Main St, San Francisco, CA',
            tier: 'SUPER_HUB',
            rating: 4.9,
            totalDeliveries: 1234,
            successRate: '98.50',
            reviewCount: 256,
            capacity: 150,
            host: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              fullName: 'John Doe',
              email: 'john.doe@example.com',
            },
          },
        ],
      },
    },
  })
  async getLeaderboard(@Query('limit') limit?: number) {
    return this.rankingsService.getLeaderboard(limit);
  }

  @Get('leaderboard/tier/:tier')
  @ApiOperation({ summary: 'Get hub leaderboard filtered by tier' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of hubs to return',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns top hubs for specific tier',
    schema: {
      example: {
        tier: 'SUPER_HUB',
        totalHubs: 15,
        leaderboard: [
          {
            rank: 1,
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Downtown Hub',
            address: '123 Main St',
            tier: 'SUPER_HUB',
            rating: 4.9,
            totalDeliveries: 1234,
            successRate: '98.50',
            reviewCount: 256,
            host: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              fullName: 'John Doe',
              email: 'john.doe@example.com',
            },
          },
        ],
      },
    },
  })
  async getLeaderboardByTier(@Param('tier') tier: HubTier, @Query('limit') limit?: number) {
    return this.rankingsService.getLeaderboardByTier(tier, limit);
  }

  @Get('hub/:hubId/rank')
  @ApiOperation({ summary: 'Get specific hub rank and tier progression info' })
  @ApiResponse({
    status: 200,
    description: 'Returns hub ranking details and tier requirements',
    schema: {
      example: {
        hub: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Downtown Hub',
          address: '123 Main St',
          tier: 'TOP_HUB',
          rating: 4.7,
        },
        ranking: {
          rank: 15,
          tier: 'TOP_HUB',
          totalDeliveries: 350,
          successRate: '92.50',
          reviewCount: 78,
        },
        tierRequirements: {
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
        },
        nextTier: {
          tier: 'SUPER_HUB',
          requirements: {
            minDeliveries: 500,
            minRating: 4.8,
            minSuccessRate: 95,
            minReviews: 100,
          },
        },
      },
    },
  })
  async getHubRank(@Param('hubId') hubId: string) {
    return this.rankingsService.getHubRank(hubId);
  }

  @Post('hub/:hubId/update-tier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recalculate and update hub tier based on current performance',
  })
  @ApiResponse({
    status: 200,
    description: 'Hub tier updated successfully',
    schema: {
      example: {
        hubId: '123e4567-e89b-12d3-a456-426614174000',
        hubName: 'Downtown Hub',
        previousTier: 'TOP_HUB',
        newTier: 'SUPER_HUB',
        metrics: {
          totalDeliveries: 523,
          successfulDeliveries: 510,
          successRate: '97.51',
          rating: 4.85,
          reviewCount: 128,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  async updateHubTier(@Param('hubId') hubId: string) {
    return this.rankingsService.updateHubTier(hubId);
  }

  @Post('update-all-tiers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recalculate and update all hub tiers (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'All hub tiers updated successfully',
    schema: {
      example: {
        totalHubsProcessed: 156,
        tierChanges: 12,
        changes: [
          {
            hubId: '123e4567-e89b-12d3-a456-426614174000',
            hubName: 'Downtown Hub',
            previousTier: 'TOP_HUB',
            newTier: 'SUPER_HUB',
            metrics: {
              totalDeliveries: 523,
              successfulDeliveries: 510,
              successRate: '97.51',
              rating: 4.85,
              reviewCount: 128,
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateAllTiers() {
    return this.rankingsService.updateAllHubTiers();
  }
}
