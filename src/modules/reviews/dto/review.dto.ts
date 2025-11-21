import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Hub ID to review' })
  @IsNotEmpty()
  @IsString()
  hubId: string;

  @ApiProperty({ description: 'Delivery ID (optional)', required: false })
  @IsOptional()
  @IsString()
  deliveryId?: string;

  @ApiProperty({ description: 'Rating (1-5)', minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateReviewDto {
  @ApiProperty({ description: 'Rating (1-5)', minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ description: 'Review comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReviewResponseDto {
  @ApiProperty({ description: 'Review ID' })
  id: string;

  @ApiProperty({ description: 'Hub ID' })
  hubId: string;

  @ApiProperty({ description: 'Delivery ID', required: false })
  deliveryId?: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Rating (1-5)' })
  rating: number;

  @ApiProperty({ description: 'Comment', required: false })
  comment?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}

export class HubRatingsSummaryDto {
  @ApiProperty({ description: 'Hub ID' })
  hubId: string;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total reviews count' })
  totalReviews: number;

  @ApiProperty({ description: 'Rating breakdown by stars (1-5)' })
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };

  @ApiProperty({ description: 'Recent reviews' })
  recentReviews: ReviewResponseDto[];
}
