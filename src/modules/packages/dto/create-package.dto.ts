import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackageDto {
  @ApiProperty({
    description: 'Unique tracking number for the package',
    example: 'TRK-2024-001234',
  })
  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @ApiProperty({
    description: 'Barcode or QR code for scanning',
    example: 'BAR-ABC123XYZ',
  })
  @IsString()
  @IsNotEmpty()
  barcode: string;

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
    description: 'Package weight in kg',
    example: 2.5,
    minimum: 0.01,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Package dimensions (LxWxH in cm)',
    example: '30x20x10',
  })
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiPropertyOptional({
    description: 'Special delivery notes',
    example: 'Leave at front door',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
