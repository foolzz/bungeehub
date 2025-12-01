import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  HubRatingsSummaryDto,
} from './dto/review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, type: ReviewResponseDto, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - already reviewed' })
  @ApiResponse({ status: 404, description: 'Hub or delivery not found' })
  async createReview(@Body() dto: CreateReviewDto, @Request() req: any) {
    return this.reviewsService.createReview(dto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReview(@Param('id') id: string) {
    return this.reviewsService.getReview(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, type: ReviewResponseDto, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateReview(@Param('id') id: string, @Body() dto: UpdateReviewDto, @Request() req: any) {
    return this.reviewsService.updateReview(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    await this.reviewsService.deleteReview(id, req.user.id, isAdmin);
    return { message: 'Review deleted successfully' };
  }

  @Get('hub/:hubId')
  @ApiOperation({ summary: 'Get all reviews for a hub' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async getHubReviews(
    @Param('hubId') hubId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewsService.getHubReviews(hubId, page, limit);
  }

  @Get('hub/:hubId/summary')
  @ApiOperation({ summary: 'Get ratings summary for a hub' })
  @ApiResponse({ status: 200, type: HubRatingsSummaryDto })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  async getHubRatingsSummary(@Param('hubId') hubId: string) {
    return this.reviewsService.getHubRatingsSummary(hubId);
  }

  @Get('customer/me')
  @ApiOperation({ summary: 'Get current customer\'s reviews' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of customer reviews' })
  async getMyReviews(
    @Request() req: any,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewsService.getCustomerReviews(req.user.id, page, limit);
  }

  @Get('customer/:customerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get reviews by customer (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of customer reviews' })
  async getCustomerReviews(
    @Param('customerId') customerId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewsService.getCustomerReviews(customerId, page, limit);
  }
}
