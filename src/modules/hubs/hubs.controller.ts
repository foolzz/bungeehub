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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { HubsService } from './hubs.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubDto } from './dto/update-hub.dto';
import { QueryHubDto } from './dto/query-hub.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('hubs')
@Controller('hubs')
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new delivery hub' })
  @ApiResponse({
    status: 201,
    description: 'Hub successfully created',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        hostId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Downtown Hub',
        address: '123 Main St, San Francisco, CA 94102',
        latitude: 37.7749,
        longitude: -122.4194,
        capacity: 100,
        status: 'PENDING',
        tier: 'NEW_HUB',
        rating: 0,
        totalDeliveries: 0,
        host: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'john.doe@example.com',
          fullName: 'John Doe',
          phone: '+1234567890',
        },
        createdAt: '2025-11-15T02:30:00.000Z',
        updatedAt: '2025-11-15T02:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only hub hosts can create hubs' })
  async createHub(@Body() createHubDto: CreateHubDto, @CurrentUser() user: any) {
    return this.hubsService.create(createHubDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all delivery hubs with filtering' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by hub status' })
  @ApiQuery({ name: 'tier', required: false, description: 'Filter by hub tier' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Filter by minimum rating' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of hubs',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Downtown Hub',
            address: '123 Main St, San Francisco, CA 94102',
            capacity: 100,
            status: 'ACTIVE',
            tier: 'SUPER_HUB',
            rating: 4.8,
            totalDeliveries: 523,
            host: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              fullName: 'John Doe',
            },
            _count: {
              packages: 45,
              deliveries: 523,
              reviews: 128,
            },
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 20,
          totalPages: 5,
        },
      },
    },
  })
  async listHubs(@Query() queryDto: QueryHubDto) {
    return this.hubsService.findAll(queryDto);
  }

  @Get('my-hubs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get hubs managed by current user' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by hub status' })
  @ApiQuery({ name: 'tier', required: false, description: 'Filter by hub tier' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Returns hubs for current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyHubs(@CurrentUser() user: any, @Query() queryDto: QueryHubDto) {
    return this.hubsService.findByHostId(user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hub details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns hub details',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Downtown Hub',
        address: '123 Main St, San Francisco, CA 94102',
        latitude: 37.7749,
        longitude: -122.4194,
        capacity: 100,
        status: 'ACTIVE',
        tier: 'SUPER_HUB',
        rating: 4.8,
        totalDeliveries: 523,
        host: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'john.doe@example.com',
          fullName: 'John Doe',
          phone: '+1234567890',
        },
        _count: {
          packages: 45,
          deliveries: 523,
          reviews: 128,
        },
        createdAt: '2025-11-15T02:30:00.000Z',
        updatedAt: '2025-11-15T02:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  async getHub(@Param('id') id: string) {
    return this.hubsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update hub information' })
  @ApiResponse({ status: 200, description: 'Hub successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You can only update your own hubs' })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  async updateHub(
    @Param('id') id: string,
    @Body() updateHubDto: UpdateHubDto,
    @CurrentUser() user: any,
  ) {
    return this.hubsService.update(id, updateHubDto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a hub (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Hub successfully deactivated',
    schema: {
      example: {
        message: 'Hub successfully deactivated',
        hub: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Downtown Hub',
          status: 'INACTIVE',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot delete hub with active packages' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You can only delete your own hubs' })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  async deleteHub(@Param('id') id: string, @CurrentUser() user: any) {
    return this.hubsService.remove(id, user.id, user.role);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get hub performance metrics' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include in metrics',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns hub performance metrics',
    schema: {
      example: {
        hub: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Downtown Hub',
          tier: 'SUPER_HUB',
          rating: 4.8,
        },
        period: {
          days: 30,
          startDate: '2025-10-16T00:00:00.000Z',
          endDate: '2025-11-15T00:00:00.000Z',
        },
        aggregates: {
          totalPackagesReceived: 3000,
          totalPackagesDelivered: 2850,
          totalPackagesFailed: 150,
          deliverySuccessRate: '95.00',
          avgDeliveryTimeMinutes: 180,
          avgCustomerRating: '4.70',
        },
        dailyMetrics: [
          {
            date: '2025-11-14',
            packagesReceived: 100,
            packagesDelivered: 95,
            packagesFailed: 5,
            avgDeliveryTime: 180,
            customerRating: 4.7,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  async getHubMetrics(@Param('id') id: string, @Query('days') days?: number) {
    return this.hubsService.getMetrics(id, days);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get hub reviews' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated hub reviews',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            hubId: '123e4567-e89b-12d3-a456-426614174001',
            customerId: '123e4567-e89b-12d3-a456-426614174002',
            rating: 5,
            comment: 'Excellent service! Package arrived on time.',
            customer: {
              id: '123e4567-e89b-12d3-a456-426614174002',
              fullName: 'Alice Johnson',
            },
            createdAt: '2025-11-15T02:30:00.000Z',
          },
        ],
        meta: {
          total: 128,
          page: 1,
          limit: 20,
          totalPages: 7,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  async getHubReviews(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.hubsService.getReviews(id, page, limit);
  }
}
