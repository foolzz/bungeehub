import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { BatchStatus } from '@prisma/client';

export class UpdateBatchDto {
  @ApiPropertyOptional({
    description: 'Batch status',
    enum: BatchStatus,
    example: BatchStatus.IN_TRANSIT,
  })
  @IsEnum(BatchStatus)
  @IsOptional()
  status?: BatchStatus;

  @ApiPropertyOptional({
    description: 'Expected delivery date',
    example: '2025-11-20T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({
    description: 'Special notes for the batch',
    example: 'Priority delivery batch',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
