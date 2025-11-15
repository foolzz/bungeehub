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
  ApiBody,
} from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  // ==================== Package Endpoints ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new package' })
  @ApiResponse({ status: 201, description: 'Package successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Package with tracking number or barcode already exists' })
  async createPackage(@Body() createPackageDto: CreatePackageDto) {
    return this.packagesService.createPackage(createPackageDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all packages with filtering' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by package status' })
  @ApiQuery({ name: 'hubId', required: false, description: 'Filter by hub ID' })
  @ApiQuery({ name: 'batchId', required: false, description: 'Filter by batch ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Returns paginated list of packages' })
  async listPackages(@Query() queryDto: QueryPackageDto) {
    return this.packagesService.findAllPackages(queryDto);
  }

  @Get('tracking/:trackingNumber')
  @ApiOperation({ summary: 'Track package by tracking number' })
  @ApiResponse({ status: 200, description: 'Returns package details' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async trackPackage(@Param('trackingNumber') trackingNumber: string) {
    return this.packagesService.findPackageByTrackingNumber(trackingNumber);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Find package by barcode' })
  @ApiResponse({ status: 200, description: 'Returns package details' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.packagesService.findPackageByBarcode(barcode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package by ID' })
  @ApiResponse({ status: 200, description: 'Returns package details' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async getPackage(@Param('id') id: string) {
    return this.packagesService.findPackageById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update package information' })
  @ApiResponse({ status: 200, description: 'Package successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async updatePackage(@Param('id') id: string, @Body() updatePackageDto: UpdatePackageDto) {
    return this.packagesService.updatePackage(id, updatePackageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a package' })
  @ApiResponse({ status: 200, description: 'Package successfully deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete package in transit or delivered' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async deletePackage(@Param('id') id: string) {
    return this.packagesService.deletePackage(id);
  }

  // ==================== Batch Endpoints ====================

  @Post('batches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new batch' })
  @ApiResponse({ status: 201, description: 'Batch successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Batch with this number already exists' })
  async createBatch(@Body() createBatchDto: CreateBatchDto) {
    return this.packagesService.createBatch(createBatchDto);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List all batches' })
  @ApiQuery({ name: 'hubId', required: false, description: 'Filter by hub ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Returns paginated list of batches' })
  async listBatches(
    @Query('hubId') hubId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.packagesService.findAllBatches(hubId, page, limit);
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get batch by ID' })
  @ApiResponse({ status: 200, description: 'Returns batch details with packages' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async getBatch(@Param('id') id: string) {
    return this.packagesService.findBatchById(id);
  }

  @Put('batches/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update batch information' })
  @ApiResponse({ status: 200, description: 'Batch successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async updateBatch(@Param('id') id: string, @Body() updateBatchDto: UpdateBatchDto) {
    return this.packagesService.updateBatch(id, updateBatchDto);
  }

  @Delete('batches/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a batch' })
  @ApiResponse({ status: 200, description: 'Batch successfully deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete batch with packages' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async deleteBatch(@Param('id') id: string) {
    return this.packagesService.deleteBatch(id);
  }

  @Post('batches/:id/assign-packages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign packages to a batch' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        packageIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Packages successfully assigned to batch' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async assignPackagesToBatch(
    @Param('id') batchId: string,
    @Body('packageIds') packageIds: string[],
  ) {
    return this.packagesService.assignPackagesToBatch(batchId, packageIds);
  }
}
