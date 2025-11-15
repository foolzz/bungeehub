import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DeliveryStatus } from '@prisma/client';

export class UpdateDeliveryDto {
  @ApiPropertyOptional({
    description: 'Delivery status',
    enum: DeliveryStatus,
    example: DeliveryStatus.IN_PROGRESS,
  })
  @IsEnum(DeliveryStatus)
  @IsOptional()
  status?: DeliveryStatus;

  @ApiPropertyOptional({
    description: 'Delivery notes',
    example: 'Attempted delivery - recipient not home',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
