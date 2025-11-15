import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { HubStatus } from '@prisma/client';

export class ReviewHubDto {
  @ApiProperty({
    enum: [
      HubStatus.UNDER_REVIEW,
      HubStatus.APPROVED,
      HubStatus.REJECTED,
    ],
    example: HubStatus.APPROVED,
  })
  @IsEnum([
    HubStatus.UNDER_REVIEW,
    HubStatus.APPROVED,
    HubStatus.REJECTED,
  ])
  @IsNotEmpty()
  status: HubStatus;

  @ApiPropertyOptional({ example: 'Application looks good. Approved for activation.' })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiPropertyOptional({
    example: 'Property photos are unclear. Please upload better quality images.',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class RequestMoreInfoDto {
  @ApiProperty({ example: 'Please provide additional photos of your storage area.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: 'Additional Photos Required' })
  @IsString()
  @IsOptional()
  subject?: string;
}
