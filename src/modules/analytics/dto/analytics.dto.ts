import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';

export enum TimePeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @ApiProperty({ enum: TimePeriod, required: false, default: TimePeriod.MONTH })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod = TimePeriod.MONTH;

  @ApiProperty({ required: false, description: 'Start date for custom period' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for custom period' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Hub ID to filter by' })
  @IsOptional()
  @IsString()
  hubId?: string;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total active hubs' })
  totalHubs: number;

  @ApiProperty({ description: 'Total packages processed' })
  totalPackages: number;

  @ApiProperty({ description: 'Total deliveries completed' })
  totalDeliveries: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Average delivery time in hours' })
  avgDeliveryTime: number;

  @ApiProperty({ description: 'Total earnings in cents' })
  totalEarnings: number;

  @ApiProperty({ description: 'Active packages currently in system' })
  activePackages: number;

  @ApiProperty({ description: 'Packages delivered today' })
  deliveriesToday: number;

  @ApiProperty({ description: 'Growth percentage compared to previous period' })
  growthRate: number;
}

export class TimeSeriesDataPoint {
  @ApiProperty({ description: 'Date or timestamp' })
  date: string;

  @ApiProperty({ description: 'Value for this data point' })
  value: number;

  @ApiProperty({ description: 'Additional label', required: false })
  label?: string;
}

export class DeliveryTrendsDto {
  @ApiProperty({ type: [TimeSeriesDataPoint], description: 'Daily delivery counts' })
  deliveries: TimeSeriesDataPoint[];

  @ApiProperty({ type: [TimeSeriesDataPoint], description: 'Daily package counts' })
  packages: TimeSeriesDataPoint[];

  @ApiProperty({ type: [TimeSeriesDataPoint], description: 'Success rate over time' })
  successRate: TimeSeriesDataPoint[];
}

export class HubPerformanceDto {
  @ApiProperty({ description: 'Hub ID' })
  hubId: string;

  @ApiProperty({ description: 'Hub name' })
  hubName: string;

  @ApiProperty({ description: 'Total deliveries' })
  totalDeliveries: number;

  @ApiProperty({ description: 'Successful deliveries' })
  successfulDeliveries: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Average delivery time in hours' })
  avgDeliveryTime: number;

  @ApiProperty({ description: 'Hub rating' })
  rating: number;

  @ApiProperty({ description: 'Total earnings in cents' })
  totalEarnings: number;
}

export class GeographicDistributionDto {
  @ApiProperty({ description: 'Location name (city/state)' })
  location: string;

  @ApiProperty({ description: 'Number of hubs' })
  hubCount: number;

  @ApiProperty({ description: 'Number of deliveries' })
  deliveryCount: number;

  @ApiProperty({ description: 'Latitude', required: false })
  latitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  longitude?: number;
}

export class PackageStatusDistributionDto {
  @ApiProperty({ description: 'Package status' })
  status: string;

  @ApiProperty({ description: 'Count of packages' })
  count: number;

  @ApiProperty({ description: 'Percentage of total' })
  percentage: number;
}

export class RevenueAnalyticsDto {
  @ApiProperty({ description: 'Total revenue in cents' })
  totalRevenue: number;

  @ApiProperty({ type: [TimeSeriesDataPoint], description: 'Revenue over time' })
  revenueOverTime: TimeSeriesDataPoint[];

  @ApiProperty({ description: 'Revenue by hub', type: 'object' })
  revenueByHub: Record<string, number>;

  @ApiProperty({ description: 'Average revenue per delivery in cents' })
  avgRevenuePerDelivery: number;

  @ApiProperty({ description: 'Growth percentage' })
  growthRate: number;
}
