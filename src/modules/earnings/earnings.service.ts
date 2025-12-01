import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateEarningDto,
  CreatePayoutDto,
  EarningsSummaryDto,
  EarningsBreakdownDto,
  PayoutHistoryDto,
  EarningsFilterDto,
  PayoutStatus,
  EarningType,
} from './dto/earnings.dto';

@Injectable()
export class EarningsService {
  private readonly logger = new Logger(EarningsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new earning record
   */
  async createEarning(dto: CreateEarningDto) {
    this.logger.log(`Creating earning for hub ${dto.hubId}: ${dto.amount} cents`);

    // Verify hub exists
    const hub = await this.prisma.hub.findUnique({
      where: { id: dto.hubId },
    });

    if (!hub) {
      throw new NotFoundException(`Hub ${dto.hubId} not found`);
    }

    // Create earning record (we'll add this table to schema)
    const earning = await this.prisma.$executeRaw`
      INSERT INTO earnings (id, hub_id, amount, type, delivery_id, description, metadata, created_at)
      VALUES (
        gen_random_uuid(),
        ${dto.hubId}::uuid,
        ${dto.amount},
        ${dto.type},
        ${dto.deliveryId || null}::uuid,
        ${dto.description || null},
        ${JSON.stringify(dto.metadata || {})}::jsonb,
        NOW()
      )
      RETURNING *
    `.catch(async (error) => {
      // Table doesn't exist yet, create it
      this.logger.warn('Earnings table does not exist, creating it...');
      await this.createEarningsTable();
      // Retry the insert
      return this.prisma.$executeRaw`
        INSERT INTO earnings (id, hub_id, amount, type, delivery_id, description, metadata, created_at)
        VALUES (
          gen_random_uuid(),
          ${dto.hubId}::uuid,
          ${dto.amount},
          ${dto.type},
          ${dto.deliveryId || null}::uuid,
          ${dto.description || null},
          ${JSON.stringify(dto.metadata || {})}::jsonb,
          NOW()
        )
      `;
    });

    this.logger.log(`Created earning for hub ${dto.hubId}`);
    return earning;
  }

  /**
   * Get earnings summary for a hub
   */
  async getEarningsSummary(hubId: string): Promise<EarningsSummaryDto> {
    this.logger.log(`Getting earnings summary for hub ${hubId}`);

    const hub = await this.prisma.hub.findUnique({
      where: { id: hubId },
    });

    if (!hub) {
      throw new NotFoundException(`Hub ${hubId} not found`);
    }

    try {
      // Get total earnings
      const totalEarnings = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM earnings
        WHERE hub_id = ${hubId}::uuid
      `;

      // Get total paid out
      const totalPaidOut = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payouts
        WHERE hub_id = ${hubId}::uuid AND status = 'COMPLETED'
      `.catch(() => [{ total: BigInt(0) }]);

      // Get pending payouts
      const pendingPayouts = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payouts
        WHERE hub_id = ${hubId}::uuid AND status IN ('PENDING', 'PROCESSING')
      `.catch(() => [{ total: BigInt(0) }]);

      // Get deliveries count
      const deliveriesCount = await this.prisma.delivery.count({
        where: { package: { batch: { hubId } } },
      });

      // Get earnings this month
      const earningsThisMonth = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM earnings
        WHERE hub_id = ${hubId}::uuid
          AND created_at >= date_trunc('month', CURRENT_DATE)
      `;

      // Get earnings last month
      const earningsLastMonth = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM earnings
        WHERE hub_id = ${hubId}::uuid
          AND created_at >= date_trunc('month', CURRENT_DATE - interval '1 month')
          AND created_at < date_trunc('month', CURRENT_DATE)
      `;

      const total = Number(totalEarnings[0]?.total || 0);
      const paidOut = Number(totalPaidOut[0]?.total || 0);
      const pending = Number(pendingPayouts[0]?.total || 0);
      const available = total - paidOut - pending;

      return {
        totalEarnings: total,
        availableBalance: Math.max(0, available),
        pendingBalance: pending,
        totalPaidOut: paidOut,
        deliveriesCompleted: deliveriesCount,
        avgEarningPerDelivery: deliveriesCount > 0 ? Math.round(total / deliveriesCount) : 0,
        earningsThisMonth: Number(earningsThisMonth[0]?.total || 0),
        earningsLastMonth: Number(earningsLastMonth[0]?.total || 0),
      };
    } catch (error) {
      this.logger.error(`Error getting earnings summary: ${error.message}`);
      // Return empty summary if tables don't exist
      return {
        totalEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0,
        totalPaidOut: 0,
        deliveriesCompleted: 0,
        avgEarningPerDelivery: 0,
        earningsThisMonth: 0,
        earningsLastMonth: 0,
      };
    }
  }

  /**
   * Get earnings breakdown by type
   */
  async getEarningsBreakdown(hubId: string): Promise<EarningsBreakdownDto> {
    this.logger.log(`Getting earnings breakdown for hub ${hubId}`);

    try {
      const breakdown = await this.prisma.$queryRaw<
        Array<{ type: string; total: bigint }>
      >`
        SELECT type, COALESCE(SUM(amount), 0) as total
        FROM earnings
        WHERE hub_id = ${hubId}::uuid
        GROUP BY type
      `;

      const result = {
        deliveryEarnings: 0,
        bonusEarnings: 0,
        referralEarnings: 0,
        adjustments: 0,
        total: 0,
      };

      breakdown.forEach((item) => {
        const amount = Number(item.total);
        switch (item.type) {
          case 'DELIVERY':
            result.deliveryEarnings = amount;
            break;
          case 'BONUS':
            result.bonusEarnings = amount;
            break;
          case 'REFERRAL':
            result.referralEarnings = amount;
            break;
          case 'ADJUSTMENT':
            result.adjustments = amount;
            break;
        }
        result.total += amount;
      });

      return result;
    } catch (error) {
      this.logger.error(`Error getting earnings breakdown: ${error.message}`);
      return {
        deliveryEarnings: 0,
        bonusEarnings: 0,
        referralEarnings: 0,
        adjustments: 0,
        total: 0,
      };
    }
  }

  /**
   * Create a payout for a hub
   */
  async createPayout(dto: CreatePayoutDto) {
    this.logger.log(`Creating payout for hub ${dto.hubId}: ${dto.amount} cents`);

    // Get available balance
    const summary = await this.getEarningsSummary(dto.hubId);

    if (summary.availableBalance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${summary.availableBalance}, Requested: ${dto.amount}`,
      );
    }

    // Create payout record
    await this.createPayoutsTable();

    const payout = await this.prisma.$executeRaw`
      INSERT INTO payouts (id, hub_id, amount, status, notes, created_at)
      VALUES (
        gen_random_uuid(),
        ${dto.hubId}::uuid,
        ${dto.amount},
        'PENDING',
        ${dto.notes || null},
        NOW()
      )
    `;

    this.logger.log(`Created payout for hub ${dto.hubId}`);

    // TODO: Integrate with Stripe Connect to actually transfer money
    // For now, we'll just mark it as processing
    await this.prisma.$executeRaw`
      UPDATE payouts
      SET status = 'PROCESSING', updated_at = NOW()
      WHERE hub_id = ${dto.hubId}::uuid AND status = 'PENDING'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return payout;
  }

  /**
   * Get payout history for a hub
   */
  async getPayoutHistory(hubId: string, limit: number = 20): Promise<PayoutHistoryDto[]> {
    this.logger.log(`Getting payout history for hub ${hubId}`);

    try {
      const payouts = await this.prisma.$queryRaw<PayoutHistoryDto[]>`
        SELECT
          id,
          amount,
          status,
          stripe_payout_id as "stripePayoutId",
          created_at as "createdAt",
          completed_at as "completedAt",
          failure_reason as "failureReason",
          notes
        FROM payouts
        WHERE hub_id = ${hubId}::uuid
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return payouts;
    } catch (error) {
      this.logger.error(`Error getting payout history: ${error.message}`);
      return [];
    }
  }

  /**
   * Get earnings list with filters
   */
  async getEarnings(filter: EarningsFilterDto) {
    this.logger.log(`Getting earnings with filters: ${JSON.stringify(filter)}`);

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (filter.hubId) {
        whereClause += ` AND hub_id = $${params.length + 1}::uuid`;
        params.push(filter.hubId);
      }

      if (filter.type) {
        whereClause += ` AND type = $${params.length + 1}`;
        params.push(filter.type);
      }

      if (filter.startDate) {
        whereClause += ` AND created_at >= $${params.length + 1}`;
        params.push(filter.startDate);
      }

      if (filter.endDate) {
        whereClause += ` AND created_at <= $${params.length + 1}`;
        params.push(filter.endDate);
      }

      const earnings = await this.prisma.$queryRawUnsafe(`
        SELECT
          id,
          hub_id as "hubId",
          amount,
          type,
          delivery_id as "deliveryId",
          description,
          metadata,
          created_at as "createdAt"
        FROM earnings
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      const total = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM earnings ${whereClause}`,
        ...params,
      );

      return {
        data: earnings,
        total: Number(total[0]?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(total[0]?.count || 0) / limit),
      };
    } catch (error) {
      this.logger.error(`Error getting earnings: ${error.message}`);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  /**
   * Calculate earnings for a delivery
   */
  async calculateDeliveryEarnings(deliveryId: string): Promise<number> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        package: {
          include: {
            batch: {
              include: {
                hub: true,
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    // Base earnings: $3.00 per delivery
    let earnings = 300;

    // Add distance bonus (if package has route info)
    // $0.50 per mile (simulated)
    const distanceBonus = Math.floor(Math.random() * 200); // Random 0-200 cents
    earnings += distanceBonus;

    // Add tier bonus based on hub rank
    if (delivery.package.batch) {
      const hub = delivery.package.batch.hub;
      switch (hub.tier) {
        case 'SUPER_HUB':
          earnings += 100; // $1.00 bonus for SUPER hubs
          break;
        case 'TOP_HUB':
          earnings += 50; // $0.50 bonus for TOP hubs
          break;
        case 'ACTIVE_HUB':
          earnings += 25; // $0.25 bonus for ACTIVE hubs
          break;
      }
    }

    return earnings;
  }

  /**
   * Process delivery completion and create earning
   */
  async processDeliveryCompletion(deliveryId: string) {
    this.logger.log(`Processing delivery completion earnings for ${deliveryId}`);

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        package: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    const earnings = await this.calculateDeliveryEarnings(deliveryId);

    if (!delivery.package.batch) {
      throw new Error(`Delivery ${deliveryId} has no associated batch`);
    }

    await this.createEarning({
      hubId: delivery.package.batch.hubId,
      amount: earnings,
      type: EarningType.DELIVERY,
      deliveryId,
      description: `Delivery completed: ${delivery.package.trackingNumber}`,
      metadata: {
        packageId: delivery.packageId,
        batchId: delivery.package.batchId,
      },
    });

    this.logger.log(`Created earning of ${earnings} cents for delivery ${deliveryId}`);
    return earnings;
  }

  /**
   * Create earnings table if it doesn't exist
   */
  private async createEarningsTable() {
    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS earnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hub_id UUID NOT NULL REFERENCES "Hub"(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        delivery_id UUID REFERENCES "Delivery"(id) ON DELETE SET NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_earnings_hub_id ON earnings(hub_id)
    `;

    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_earnings_created_at ON earnings(created_at)
    `;

    this.logger.log('Created earnings table');
  }

  /**
   * Create payouts table if it doesn't exist
   */
  private async createPayoutsTable() {
    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS payouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hub_id UUID NOT NULL REFERENCES "Hub"(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        stripe_payout_id VARCHAR(255),
        failure_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `;

    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_payouts_hub_id ON payouts(hub_id)
    `;

    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status)
    `;

    this.logger.log('Created payouts table');
  }
}
