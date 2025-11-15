import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ScanPackageDto {
  @ApiProperty({
    description: 'Package barcode or QR code',
    example: 'BAR-ABC123XYZ',
  })
  @IsString()
  @IsNotEmpty()
  barcode: string;

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
    example: 'Package received at hub',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
