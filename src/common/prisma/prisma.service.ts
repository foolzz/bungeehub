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
      this.logger.error('❌ Failed to connect to database');
      this.logger.error(`Error details: ${error.message || error}`);
      this.logger.warn('⚠️ Continuing without database connection - API endpoints will not work');
      // Don't throw error to allow the app to start and serve static files
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

    // Clean all tables for testing purposes (in correct order due to foreign keys)
    await this.notification.deleteMany();
    await this.message.deleteMany();
    await this.hubPhoto.deleteMany();
    await this.apiKey.deleteMany();
    await this.webhookConfig.deleteMany();
    await this.eventLog.deleteMany();
    await this.hubReview.deleteMany();
    await this.hubMetric.deleteMany();
    await this.delivery.deleteMany();
    await this.batch.deleteMany();
    await this.package.deleteMany();
    await this.hub.deleteMany();
    await this.user.deleteMany();
  }
}
