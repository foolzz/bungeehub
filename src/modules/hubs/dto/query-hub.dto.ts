import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { HubStatus, HubTier } from '@prisma/client';

export class QueryHubDto {
  @ApiPropertyOptional({
    description: 'Filter by hub status',
    enum: HubStatus,
    example: HubStatus.ACTIVE,
  })
  @IsEnum(HubStatus)
  @IsOptional()
  status?: HubStatus;

  @ApiPropertyOptional({
    description: 'Filter by hub tier',
    enum: HubTier,
    example: HubTier.SUPER_HUB,
  })
  @IsEnum(HubTier)
  @IsOptional()
  tier?: HubTier;

  @ApiPropertyOptional({
    description: 'Filter by minimum rating',
    example: 4.0,
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number;
}
