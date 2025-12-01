import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { ProofOfDeliveryDto } from './dto/proof-of-delivery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DeliveryStatus } from '@prisma/client';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new delivery' })
  @ApiResponse({ status: 201, description: 'Delivery successfully created' })
  @ApiResponse({ status: 400, description: 'Delivery already exists or invalid package status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Package or hub not found' })
  async createDelivery(@Body() createDeliveryDto: CreateDeliveryDto, @CurrentUser() user: any) {
    return this.deliveriesService.createDelivery(createDeliveryDto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by ID' })
  @ApiResponse({ status: 200, description: 'Returns delivery details' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async getDelivery(@Param('id') id: string) {
    return this.deliveriesService.findDeliveryById(id);
  }

  @Get('package/:packageId')
  @ApiOperation({ summary: 'Get delivery by package ID' })
  @ApiResponse({ status: 200, description: 'Returns delivery details' })
  @ApiResponse({ status: 404, description: 'Delivery not found for this package' })
  async getDeliveryByPackage(@Param('packageId') packageId: string) {
    return this.deliveriesService.findDeliveryByPackage(packageId);
  }

  @Get('hub/:hubId')
  @ApiOperation({ summary: 'Get deliveries for a specific hub' })
  @ApiQuery({ name: 'status', required: false, enum: DeliveryStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Returns paginated list of deliveries for the hub' })
  async getDeliveriesByHub(
    @Param('hubId') hubId: string,
    @Query('status') status?: DeliveryStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.deliveriesService.findDeliveriesByHub(hubId, status, page, limit);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiResponse({ status: 200, description: 'Delivery successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async updateDelivery(
    @Param('id') id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveriesService.updateDelivery(id, updateDeliveryDto, user.id);
  }

  @Post(':id/proof-of-delivery')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit proof of delivery (photo + GPS + signature)' })
  @ApiResponse({
    status: 201,
    description: 'Proof of delivery submitted successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'COMPLETED',
        proofOfDeliveryUrl: 'https://storage.googleapis.com/deliveryhub/deliveries/proof-123.jpg',
        deliveryLatitude: 37.7749,
        deliveryLongitude: -122.4194,
        recipientName: 'John Doe',
        deliveredAt: '2025-11-15T10:30:00Z',
        package: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          trackingNumber: 'TRK-2024-001234',
          status: 'DELIVERED',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Delivery already completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async submitProofOfDelivery(
    @Param('id') id: string,
    @Body() proofOfDeliveryDto: ProofOfDeliveryDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveriesService.submitProofOfDelivery(id, proofOfDeliveryDto, user.id);
  }

  @Post(':id/mark-failed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark delivery as failed' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          example: 'Recipient not available - attempted 3 times',
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery marked as failed',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'FAILED',
        notes: 'Recipient not available - attempted 3 times',
        package: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          trackingNumber: 'TRK-2024-001234',
          status: 'FAILED',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot mark completed delivery as failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  @HttpCode(HttpStatus.OK)
  async markDeliveryFailed(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.deliveriesService.markDeliveryFailed(id, reason, user.id);
  }
}
