import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HubsService } from './hubs.service';

@ApiTags('hubs')
@Controller('hubs')
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new hub' })
  async createHub() {
    return { message: 'Hub registration - Coming in Phase 2' };
  }

  @Get()
  @ApiOperation({ summary: 'List all hubs' })
  async listHubs() {
    return { message: 'Hub listing - Coming in Phase 2' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hub by ID' })
  async getHub(@Param('id') id: string) {
    return { message: 'Hub details - Coming in Phase 2', id };
  }
}
