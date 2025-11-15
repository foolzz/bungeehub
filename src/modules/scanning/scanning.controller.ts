import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ScanningService } from './scanning.service';
import { ScanPackageDto } from './dto/scan-package.dto';
import { ScanBatchDto } from './dto/scan-batch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('scanning')
@Controller('scanning')
export class ScanningController {
  constructor(private readonly scanningService: ScanningService) {}

  @Post('package')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Scan a package (QR/barcode)' })
  @ApiResponse({
    status: 201,
    description: 'Package successfully scanned and status updated',
    schema: {
      example: {
        package: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          trackingNumber: 'TRK-2024-001234',
          barcode: 'BAR-ABC123XYZ',
          status: 'AT_HUB',
          assignedHub: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Downtown Hub',
            address: '123 Main St',
          },
        },
        previousStatus: 'PENDING',
        newStatus: 'AT_HUB',
        eventMessage: 'Package arrived at hub: Downtown Hub',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Package already delivered or invalid scan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async scanPackage(@Body() scanPackageDto: ScanPackageDto, @CurrentUser() user: any) {
    return this.scanningService.scanPackage(scanPackageDto, user.id);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Scan a batch (QR code)' })
  @ApiResponse({
    status: 201,
    description: 'Batch successfully scanned and status updated',
    schema: {
      example: {
        batch: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          batchNumber: 'BATCH-2024-001',
          status: 'ARRIVED',
          hub: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Downtown Hub',
            address: '123 Main St',
          },
        },
        previousStatus: 'IN_TRANSIT',
        newStatus: 'ARRIVED',
        eventMessage: 'Batch arrived at hub: Downtown Hub',
        packagesAffected: 50,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Batch already delivered or invalid scan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async scanBatch(@Body() scanBatchDto: ScanBatchDto, @CurrentUser() user: any) {
    return this.scanningService.scanBatch(scanBatchDto, user.id);
  }

  @Get('package/:packageId/history')
  @ApiOperation({ summary: 'Get package scan history' })
  @ApiResponse({
    status: 200,
    description: 'Returns package scan history',
    schema: {
      example: {
        package: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          trackingNumber: 'TRK-2024-001234',
          barcode: 'BAR-ABC123XYZ',
          status: 'AT_HUB',
        },
        scanHistory: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            eventType: 'PACKAGE_ARRIVED',
            message: 'Package arrived at hub: Downtown Hub',
            timestamp: '2025-11-15T10:30:00Z',
            latitude: 37.7749,
            longitude: -122.4194,
            hub: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Downtown Hub',
              address: '123 Main St',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async getPackageScanHistory(@Param('packageId') packageId: string) {
    return this.scanningService.getPackageScanHistory(packageId);
  }

  @Get('batch/:batchId/history')
  @ApiOperation({ summary: 'Get batch scan history' })
  @ApiResponse({
    status: 200,
    description: 'Returns batch scan history',
    schema: {
      example: {
        batch: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          batchNumber: 'BATCH-2024-001',
          status: 'ARRIVED',
        },
        scanHistory: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            eventType: 'BATCH_ARRIVED',
            message: 'Batch arrived at hub: Downtown Hub',
            timestamp: '2025-11-15T10:30:00Z',
            latitude: 37.7749,
            longitude: -122.4194,
            hub: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Downtown Hub',
              address: '123 Main St',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async getBatchScanHistory(@Param('batchId') batchId: string) {
    return this.scanningService.getBatchScanHistory(batchId);
  }
}
