import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ScanningService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: Implement scanning in Phase 3
}
