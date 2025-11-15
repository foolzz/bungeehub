/**
 * Admin Controller
 * Handles admin operations for hub review and management
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { ReviewHubDto, RequestMoreInfoDto } from './dto/review-hub.dto';
import { HubStatus } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('applications/pending')
  @ApiOperation({ summary: 'Get pending hub applications' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getPendingApplications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPendingApplications(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('applications/:hubId')
  @ApiOperation({ summary: 'Get hub application details' })
  async getApplicationDetails(@Param('hubId') hubId: string) {
    return this.adminService.getApplicationDetails(hubId);
  }

  @Post('applications/:hubId/review')
  @ApiOperation({ summary: 'Review hub application' })
  async reviewApplication(
    @Param('hubId') hubId: string,
    @CurrentUser() user: any,
    @Body() reviewDto: ReviewHubDto,
  ) {
    return this.adminService.reviewApplication(hubId, user.id, reviewDto);
  }

  @Post('applications/:hubId/request-info')
  @ApiOperation({ summary: 'Request more information from host' })
  async requestMoreInfo(
    @Param('hubId') hubId: string,
    @CurrentUser() user: any,
    @Body() requestDto: RequestMoreInfoDto,
  ) {
    return this.adminService.requestMoreInfo(hubId, user.id, requestDto);
  }

  @Patch('photos/:photoId/approve')
  @ApiOperation({ summary: 'Approve hub photo' })
  async approvePhoto(@Param('photoId') photoId: string) {
    return this.adminService.approvePhoto(photoId);
  }

  @Delete('photos/:photoId')
  @ApiOperation({ summary: 'Delete hub photo' })
  async deletePhoto(@Param('photoId') photoId: string) {
    return this.adminService.deletePhoto(photoId);
  }

  @Get('hubs')
  @ApiOperation({ summary: 'Get all hubs with filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: HubStatus,
    example: HubStatus.ACTIVE,
  })
  @ApiQuery({ name: 'tier', required: false, example: 'ACTIVE_HUB' })
  async getAllHubs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: HubStatus,
    @Query('tier') tier?: string,
  ) {
    return this.adminService.getAllHubs(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status,
      tier,
    );
  }
}
