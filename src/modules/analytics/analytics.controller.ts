import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsQueryDto,
  DashboardStatsDto,
  DeliveryTrendsDto,
  HubPerformanceDto,
  GeographicDistributionDto,
  PackageStatusDistributionDto,
  RevenueAnalyticsDto,
} from './dto/analytics.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardStats(query);
  }

  @Get('delivery-trends')
  @ApiOperation({ summary: 'Get delivery trends over time' })
  @ApiResponse({ status: 200, type: DeliveryTrendsDto })
  async getDeliveryTrends(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDeliveryTrends(query);
  }

  @Get('hub-performance')
  @ApiOperation({ summary: 'Get hub performance metrics' })
  @ApiResponse({ status: 200, type: [HubPerformanceDto] })
  async getHubPerformance(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getHubPerformance(query);
  }

  @Get('geographic-distribution')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get geographic distribution of hubs and deliveries (Admin only)' })
  @ApiResponse({ status: 200, type: [GeographicDistributionDto] })
  async getGeographicDistribution() {
    return this.analyticsService.getGeographicDistribution();
  }

  @Get('package-status-distribution')
  @ApiOperation({ summary: 'Get package status distribution' })
  @ApiResponse({ status: 200, type: [PackageStatusDistributionDto] })
  async getPackageStatusDistribution(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPackageStatusDistribution(query);
  }

  @Get('revenue')
  @Roles(UserRole.ADMIN, UserRole.HUB_HOST)
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, type: RevenueAnalyticsDto })
  async getRevenueAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueAnalytics(query);
  }
}
