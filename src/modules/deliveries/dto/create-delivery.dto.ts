import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty({
    description: 'ID of the package being delivered',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  packageId: string;

  @ApiProperty({
    description: 'ID of the hub handling this delivery',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  hubId: string;

  @ApiPropertyOptional({
    description: 'Delivery notes or instructions',
    example: 'Ring doorbell twice',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
