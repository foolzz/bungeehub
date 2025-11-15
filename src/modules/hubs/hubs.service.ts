import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HubsService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: Implement hub management in Phase 2
}
