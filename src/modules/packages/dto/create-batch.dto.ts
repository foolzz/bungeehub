import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateBatchDto {
  @ApiProperty({
    description: 'Unique batch number',
    example: 'BATCH-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({
    description: 'ID of the hub this batch is assigned to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  hubId: string;

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
