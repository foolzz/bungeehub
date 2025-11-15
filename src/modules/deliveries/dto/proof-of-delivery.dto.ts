import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ProofOfDeliveryDto {
  @ApiProperty({
    description: 'URL or base64 of the delivery photo (package at door, recipient signature, etc.)',
    example: 'https://storage.googleapis.com/bungeehub/deliveries/proof-123.jpg',
  })
  @IsString()
  @IsNotEmpty()
  proofOfDeliveryUrl: string;

  @ApiProperty({
    description: 'GPS latitude where delivery was completed',
    example: 37.7749,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'GPS longitude where delivery was completed',
    example: -122.4194,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Name of the person who received the package',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiPropertyOptional({
    description: 'Additional delivery notes',
    example: 'Package left at front door per instructions',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
