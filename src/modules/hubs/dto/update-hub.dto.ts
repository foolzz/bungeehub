import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { HubStatus } from '@prisma/client';

export class UpdateHubDto {
  @ApiPropertyOptional({
    description: 'Name of the delivery hub',
    example: 'Downtown Hub - Updated',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Full address of the hub',
    example: '123 Main St, San Francisco, CA 94102',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 37.7749,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: -122.4194,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of packages the hub can handle',
    example: 150,
    minimum: 10,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Hub status (admin only)',
    enum: HubStatus,
    example: HubStatus.ACTIVE,
  })
  @IsEnum(HubStatus)
  @IsOptional()
  status?: HubStatus;
}
