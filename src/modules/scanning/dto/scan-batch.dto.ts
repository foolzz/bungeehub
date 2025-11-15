import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ScanBatchDto {
  @ApiProperty({
    description: 'Batch number to scan',
    example: 'BATCH-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiPropertyOptional({
    description: 'Array of package barcodes in this batch',
    example: ['BAR-ABC123XYZ', 'BAR-DEF456UVW'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  packageBarcodes?: string[];

  @ApiPropertyOptional({
    description: 'GPS latitude where scan occurred',
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
    description: 'GPS longitude where scan occurred',
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
    description: 'Additional scan notes',
    example: 'Batch received at hub',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
