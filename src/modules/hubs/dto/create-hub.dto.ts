import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHubDto {
  @ApiProperty({
    description: 'Name of the delivery hub',
    example: 'Downtown Hub',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Full address of the hub',
    example: '123 Main St, San Francisco, CA 94102',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

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

  @ApiProperty({
    description: 'Maximum number of packages the hub can handle',
    example: 100,
    minimum: 10,
    default: 100,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @IsOptional()
  capacity?: number;
}
