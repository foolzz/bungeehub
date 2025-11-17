import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({
    status: 201,
    description: 'Webhook created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'A webhook with this URL already exists',
  })
  async createWebhook(@Body() createWebhookDto: CreateWebhookDto) {
    return this.webhooksService.createWebhook(createWebhookDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiResponse({
    status: 200,
    description: 'List of all webhooks',
  })
  async getAllWebhooks() {
    return this.webhooksService.findAllWebhooks();
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get a webhook by ID' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook details',
  })
  @ApiResponse({
    status: 404,
    description: 'Webhook not found',
  })
  async getWebhookById(@Param('id') id: string) {
    return this.webhooksService.findWebhookById(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Webhook not found',
  })
  async updateWebhook(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    return this.webhooksService.updateWebhook(id, updateWebhookDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Webhook not found',
  })
  async deleteWebhook(@Param('id') id: string) {
    return this.webhooksService.deleteWebhook(id);
  }
}
