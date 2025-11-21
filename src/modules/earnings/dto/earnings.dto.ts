import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDate,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum EarningType {
  DELIVERY = 'DELIVERY',
  BONUS = 'BONUS',
  REFERRAL = 'REFERRAL',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class CreateEarningDto {
  @ApiProperty({ description: 'Hub ID that earned this amount' })
  @IsNotEmpty()
  @IsString()
  hubId: string;

  @ApiProperty({ description: 'Amount earned in cents', minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: EarningType, description: 'Type of earning' })
  @IsNotEmpty()
  @IsEnum(EarningType)
  type: EarningType;

  @ApiProperty({ description: 'Related delivery ID', required: false })
  @IsOptional()
  @IsString()
  deliveryId?: string;

  @ApiProperty({ description: 'Description of earning', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Metadata as JSON', required: false })
  @IsOptional()
  metadata?: any;
}

export class CreatePayoutDto {
  @ApiProperty({ description: 'Hub ID to pay out' })
  @IsNotEmpty()
  @IsString()
  hubId: string;

  @ApiProperty({ description: 'Amount to pay out in cents', minimum: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ description: 'Payment method ID (Stripe)', required: false })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({ description: 'Notes about payout', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class EarningsSummaryDto {
  @ApiProperty({ description: 'Total earnings in cents' })
  totalEarnings: number;

  @ApiProperty({ description: 'Available balance in cents' })
  availableBalance: number;

  @ApiProperty({ description: 'Pending balance in cents' })
  pendingBalance: number;

  @ApiProperty({ description: 'Total paid out in cents' })
  totalPaidOut: number;

  @ApiProperty({ description: 'Number of deliveries completed' })
  deliveriesCompleted: number;

  @ApiProperty({ description: 'Average earning per delivery in cents' })
  avgEarningPerDelivery: number;

  @ApiProperty({ description: 'Earnings this month in cents' })
  earningsThisMonth: number;

  @ApiProperty({ description: 'Earnings last month in cents' })
  earningsLastMonth: number;
}

export class EarningsBreakdownDto {
  @ApiProperty({ description: 'Delivery earnings in cents' })
  deliveryEarnings: number;

  @ApiProperty({ description: 'Bonus earnings in cents' })
  bonusEarnings: number;

  @ApiProperty({ description: 'Referral earnings in cents' })
  referralEarnings: number;

  @ApiProperty({ description: 'Adjustments in cents' })
  adjustments: number;

  @ApiProperty({ description: 'Total earnings in cents' })
  total: number;
}

export class PayoutHistoryDto {
  @ApiProperty({ description: 'Payout ID' })
  id: string;

  @ApiProperty({ description: 'Amount in cents' })
  amount: number;

  @ApiProperty({ enum: PayoutStatus, description: 'Payout status' })
  status: PayoutStatus;

  @ApiProperty({ description: 'Stripe payout ID', required: false })
  stripePayoutId?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Completed at timestamp', required: false })
  completedAt?: Date;

  @ApiProperty({ description: 'Failure reason', required: false })
  failureReason?: string;

  @ApiProperty({ description: 'Notes', required: false })
  notes?: string;
}

export class EarningsFilterDto {
  @ApiProperty({ description: 'Filter by hub ID', required: false })
  @IsOptional()
  @IsString()
  hubId?: string;

  @ApiProperty({ enum: EarningType, description: 'Filter by type', required: false })
  @IsOptional()
  @IsEnum(EarningType)
  type?: EarningType;

  @ApiProperty({ description: 'Start date', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({ description: 'End date', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
