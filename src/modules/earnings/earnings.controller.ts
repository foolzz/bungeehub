import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EarningsService } from './earnings.service';
import {
  CreateEarningDto,
  CreatePayoutDto,
  EarningsSummaryDto,
  EarningsBreakdownDto,
  PayoutHistoryDto,
  EarningsFilterDto,
} from './dto/earnings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('earnings')
@Controller('earnings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new earning record (Admin only)' })
  @ApiResponse({ status: 201, description: 'Earning created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createEarning(@Body() dto: CreateEarningDto) {
    return this.earningsService.createEarning(dto);
  }

  @Get('summary/:hubId')
  @ApiOperation({ summary: 'Get earnings summary for a hub' })
  @ApiResponse({ status: 200, type: EarningsSummaryDto })
  async getEarningsSummary(@Param('hubId') hubId: string, @Request() req) {
    // Users can only view their own hub's earnings (unless admin)
    if (req.user.role !== Role.ADMIN) {
      const userHubs = await this.getUserHubs(req.user.id);
      if (!userHubs.includes(hubId)) {
        throw new ForbiddenException('You can only view earnings for your own hubs');
      }
    }

    return this.earningsService.getEarningsSummary(hubId);
  }

  @Get('breakdown/:hubId')
  @ApiOperation({ summary: 'Get earnings breakdown by type for a hub' })
  @ApiResponse({ status: 200, type: EarningsBreakdownDto })
  async getEarningsBreakdown(@Param('hubId') hubId: string, @Request() req) {
    // Users can only view their own hub's earnings (unless admin)
    if (req.user.role !== Role.ADMIN) {
      const userHubs = await this.getUserHubs(req.user.id);
      if (!userHubs.includes(hubId)) {
        throw new ForbiddenException('You can only view earnings for your own hubs');
      }
    }

    return this.earningsService.getEarningsBreakdown(hubId);
  }

  @Get('list')
  @ApiOperation({ summary: 'Get earnings list with filters' })
  @ApiResponse({ status: 200, description: 'Earnings list' })
  async getEarnings(@Query() filter: EarningsFilterDto, @Request() req) {
    // If not admin, filter to only user's hubs
    if (req.user.role !== Role.ADMIN) {
      const userHubs = await this.getUserHubs(req.user.id);
      if (filter.hubId && !userHubs.includes(filter.hubId)) {
        throw new ForbiddenException('You can only view earnings for your own hubs');
      }
      // If no hubId specified, we'll need to filter by user's hubs
      // For now, require hubId
      if (!filter.hubId) {
        throw new ForbiddenException('Please specify a hubId');
      }
    }

    return this.earningsService.getEarnings(filter);
  }

  @Post('payout')
  @ApiOperation({ summary: 'Request a payout' })
  @ApiResponse({ status: 201, description: 'Payout requested successfully' })
  async createPayout(@Body() dto: CreatePayoutDto, @Request() req) {
    // Users can only request payouts for their own hubs (unless admin)
    if (req.user.role !== Role.ADMIN) {
      const userHubs = await this.getUserHubs(req.user.id);
      if (!userHubs.includes(dto.hubId)) {
        throw new ForbiddenException('You can only request payouts for your own hubs');
      }
    }

    return this.earningsService.createPayout(dto);
  }

  @Get('payout/history/:hubId')
  @ApiOperation({ summary: 'Get payout history for a hub' })
  @ApiResponse({ status: 200, type: [PayoutHistoryDto] })
  async getPayoutHistory(
    @Param('hubId') hubId: string,
    @Query('limit') limit: number = 20,
    @Request() req,
  ) {
    // Users can only view their own hub's payout history (unless admin)
    if (req.user.role !== Role.ADMIN) {
      const userHubs = await this.getUserHubs(req.user.id);
      if (!userHubs.includes(hubId)) {
        throw new ForbiddenException('You can only view payout history for your own hubs');
      }
    }

    return this.earningsService.getPayoutHistory(hubId, limit);
  }

  @Post('delivery/:deliveryId/process')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Process delivery completion and create earning (Admin only)' })
  @ApiResponse({ status: 201, description: 'Delivery earning processed' })
  async processDeliveryCompletion(@Param('deliveryId') deliveryId: string) {
    return this.earningsService.processDeliveryCompletion(deliveryId);
  }

  // Helper method to get user's hubs
  private async getUserHubs(userId: string): Promise<string[]> {
    // This would query the database to get hubs owned by this user
    // For now, returning empty array - implement based on your Hub-User relationship
    // You might need to inject PrismaService here
    return [];
  }
}
