import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to Neon PostgreSQL database');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    // Clean all tables for testing purposes
    const tables = [
      this.apiKey,
      this.webhookConfig,
      this.eventLog,
      this.hubReview,
      this.hubMetric,
      this.delivery,
      this.batch,
      this.package,
      this.hub,
      this.user,
    ];

    return Promise.all(tables.map((table) => table.deleteMany()));
  }
}
