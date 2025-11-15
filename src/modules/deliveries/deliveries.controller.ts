import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @ApiOperation({ summary: 'Submit proof of delivery' })
  async submitDelivery() {
    return { message: 'Proof of delivery - Coming in Phase 4' };
  }
}
