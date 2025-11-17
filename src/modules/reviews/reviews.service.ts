import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  HubRatingsSummaryDto,
} from './dto/review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new review
   */
  async createReview(dto: CreateReviewDto, customerId: string): Promise<ReviewResponseDto> {
    this.logger.log(`Creating review for hub ${dto.hubId} by customer ${customerId}`);

    // Verify hub exists
    const hub = await this.prisma.hub.findUnique({
      where: { id: dto.hubId },
    });

    if (!hub) {
      throw new NotFoundException(`Hub ${dto.hubId} not found`);
    }

    // If deliveryId provided, verify it exists
    if (dto.deliveryId) {
      const delivery = await this.prisma.delivery.findUnique({
        where: { id: dto.deliveryId },
      });

      if (!delivery) {
        throw new NotFoundException(`Delivery ${dto.deliveryId} not found`);
      }

      if (delivery.hubId !== dto.hubId) {
        throw new BadRequestException('Delivery does not belong to this hub');
      }
    }

    // Check if customer already reviewed this hub
    const existingReview = await this.prisma.hubReview.findFirst({
      where: {
        hubId: dto.hubId,
        customerId,
        ...(dto.deliveryId && { deliveryId: dto.deliveryId }),
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this hub/delivery');
    }

    // Create review
    const review = await this.prisma.hubReview.create({
      data: {
        hubId: dto.hubId,
        customerId,
        deliveryId: dto.deliveryId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Update hub's average rating
    await this.updateHubRating(dto.hubId);

    this.logger.log(`Created review ${review.id} for hub ${dto.hubId}`);

    return {
      id: review.id,
      hubId: review.hubId,
      deliveryId: review.deliveryId || undefined,
      customerId: review.customerId,
      customerName: review.customer.fullName,
      rating: review.rating,
      comment: review.comment || undefined,
      createdAt: review.createdAt,
    };
  }

  /**
   * Get a single review by ID
   */
  async getReview(id: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.hubReview.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    return {
      id: review.id,
      hubId: review.hubId,
      deliveryId: review.deliveryId || undefined,
      customerId: review.customerId,
      customerName: review.customer.fullName,
      rating: review.rating,
      comment: review.comment || undefined,
      createdAt: review.createdAt,
    };
  }

  /**
   * Get all reviews for a hub
   */
  async getHubReviews(
    hubId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ReviewResponseDto[]; total: number; page: number; totalPages: number }> {
    this.logger.log(`Getting reviews for hub ${hubId}`);

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.hubReview.findMany({
        where: { hubId },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.hubReview.count({ where: { hubId } }),
    ]);

    return {
      data: reviews.map((review) => ({
        id: review.id,
        hubId: review.hubId,
        deliveryId: review.deliveryId || undefined,
        customerId: review.customerId,
        customerName: review.customer.fullName,
        rating: review.rating,
        comment: review.comment || undefined,
        createdAt: review.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get hub ratings summary
   */
  async getHubRatingsSummary(hubId: string): Promise<HubRatingsSummaryDto> {
    this.logger.log(`Getting ratings summary for hub ${hubId}`);

    const hub = await this.prisma.hub.findUnique({
      where: { id: hubId },
    });

    if (!hub) {
      throw new NotFoundException(`Hub ${hubId} not found`);
    }

    // Get all reviews
    const reviews = await this.prisma.hubReview.findMany({
      where: { hubId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate rating breakdown
    const ratingBreakdown = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      ratingBreakdown[review.rating as 1 | 2 | 3 | 4 | 5]++;
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? Number((totalRating / reviews.length).toFixed(2)) : 0;

    // Get recent reviews (last 5)
    const recentReviews = reviews.slice(0, 5).map((review) => ({
      id: review.id,
      hubId: review.hubId,
      deliveryId: review.deliveryId || undefined,
      customerId: review.customerId,
      customerName: review.customer.fullName,
      rating: review.rating,
      comment: review.comment || undefined,
      createdAt: review.createdAt,
    }));

    return {
      hubId,
      averageRating,
      totalReviews: reviews.length,
      ratingBreakdown,
      recentReviews,
    };
  }

  /**
   * Update a review
   */
  async updateReview(
    id: string,
    dto: UpdateReviewDto,
    customerId: string,
  ): Promise<ReviewResponseDto> {
    this.logger.log(`Updating review ${id}`);

    const review = await this.prisma.hubReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    // Only the review author can update it
    if (review.customerId !== customerId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updatedReview = await this.prisma.hubReview.update({
      where: { id },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Update hub's average rating
    await this.updateHubRating(review.hubId);

    return {
      id: updatedReview.id,
      hubId: updatedReview.hubId,
      deliveryId: updatedReview.deliveryId || undefined,
      customerId: updatedReview.customerId,
      customerName: updatedReview.customer.fullName,
      rating: updatedReview.rating,
      comment: updatedReview.comment || undefined,
      createdAt: updatedReview.createdAt,
    };
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string, customerId: string, isAdmin: boolean = false): Promise<void> {
    this.logger.log(`Deleting review ${id}`);

    const review = await this.prisma.hubReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    // Only the review author or admin can delete it
    if (!isAdmin && review.customerId !== customerId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.hubReview.delete({
      where: { id },
    });

    // Update hub's average rating
    await this.updateHubRating(review.hubId);

    this.logger.log(`Deleted review ${id}`);
  }

  /**
   * Get customer's reviews
   */
  async getCustomerReviews(
    customerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ReviewResponseDto[]; total: number; page: number; totalPages: number }> {
    this.logger.log(`Getting reviews for customer ${customerId}`);

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.hubReview.findMany({
        where: { customerId },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.hubReview.count({ where: { customerId } }),
    ]);

    return {
      data: reviews.map((review) => ({
        id: review.id,
        hubId: review.hubId,
        deliveryId: review.deliveryId || undefined,
        customerId: review.customerId,
        customerName: review.customer.fullName,
        rating: review.rating,
        comment: review.comment || undefined,
        createdAt: review.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update hub's average rating
   */
  private async updateHubRating(hubId: string): Promise<void> {
    const reviews = await this.prisma.hubReview.findMany({
      where: { hubId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      await this.prisma.hub.update({
        where: { id: hubId },
        data: { rating: 0 },
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this.prisma.hub.update({
      where: { id: hubId },
      data: { rating: averageRating },
    });

    this.logger.log(`Updated hub ${hubId} rating to ${averageRating.toFixed(2)}`);
  }
}
