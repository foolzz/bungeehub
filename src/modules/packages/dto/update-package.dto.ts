import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PackageStatus } from '@prisma/client';

export class UpdatePackageDto {
  @ApiPropertyOptional({
    description: 'Package status',
    enum: PackageStatus,
    example: PackageStatus.AT_HUB,
  })
  @IsEnum(PackageStatus)
  @IsOptional()
  status?: PackageStatus;

  @ApiPropertyOptional({
    description: 'ID of the hub this package is assigned to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  assignedHubId?: string;

  @ApiPropertyOptional({
    description: 'ID of the batch this package belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  batchId?: string;

  @ApiPropertyOptional({
    description: 'Recipient name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiPropertyOptional({
    description: 'Recipient phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiPropertyOptional({
    description: 'Delivery address',
    example: '456 Oak St, San Francisco, CA 94102',
  })
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional({
    description: 'Special delivery notes',
    example: 'Leave at front door',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
