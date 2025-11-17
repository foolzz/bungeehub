import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { createHmac } from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Webhook Config Management ====================

  async createWebhook(createWebhookDto: CreateWebhookDto) {
    // Check if a webhook with the same URL already exists
    const existingWebhook = await this.prisma.webhookConfig.findFirst({
      where: { url: createWebhookDto.url },
    });

    if (existingWebhook) {
      throw new ConflictException('A webhook with this URL already exists');
    }

    const webhook = await this.prisma.webhookConfig.create({
      data: {
        name: createWebhookDto.name,
        url: createWebhookDto.url,
        events: createWebhookDto.events,
        secret: createWebhookDto.secret,
        active: createWebhookDto.active ?? true,
      },
    });

    this.logger.log(`Webhook created: ${webhook.name} (ID: ${webhook.id})`);

    return webhook;
  }

  async findAllWebhooks() {
    return this.prisma.webhookConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWebhookById(id: string) {
    const webhook = await this.prisma.webhookConfig.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async updateWebhook(id: string, updateWebhookDto: UpdateWebhookDto) {
    const existingWebhook = await this.prisma.webhookConfig.findUnique({
      where: { id },
    });

    if (!existingWebhook) {
      throw new NotFoundException('Webhook not found');
    }

    const updatedWebhook = await this.prisma.webhookConfig.update({
      where: { id },
      data: {
        name: updateWebhookDto.name,
        url: updateWebhookDto.url,
        events: updateWebhookDto.events,
        secret: updateWebhookDto.secret,
        active: updateWebhookDto.active,
      },
    });

    this.logger.log(`Webhook updated: ${updatedWebhook.name} (ID: ${id})`);

    return updatedWebhook;
  }

  async deleteWebhook(id: string) {
    const webhook = await this.prisma.webhookConfig.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.webhookConfig.delete({
      where: { id },
    });

    this.logger.log(`Webhook deleted: ${webhook.name} (ID: ${id})`);

    return { message: 'Webhook successfully deleted' };
  }

  // ==================== Webhook Event Firing ====================

  /**
   * Fire a webhook event to all subscribed webhooks
   */
  async fireWebhookEvent(eventType: string, data: any) {
    // Find all active webhooks subscribed to this event type
    const webhooks = await this.prisma.webhookConfig.findMany({
      where: {
        active: true,
        events: {
          has: eventType,
        },
      },
    });

    if (webhooks.length === 0) {
      this.logger.debug(`No active webhooks subscribed to event: ${eventType}`);
      return;
    }

    this.logger.log(
      `Firing webhook event '${eventType}' to ${webhooks.length} webhook(s)`,
    );

    // Fire webhooks in parallel with error handling
    const promises = webhooks.map((webhook) =>
      this.sendWebhook(webhook, eventType, data).catch((error) => {
        this.logger.error(
          `Failed to send webhook to ${webhook.url}: ${error.message}`,
          error.stack,
        );
      }),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Send a single webhook event
   */
  private async sendWebhook(
    webhook: any,
    eventType: string,
    data: any,
  ): Promise<void> {
    const payload: WebhookEventDto = {
      id: this.generateEventId(),
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    const payloadString = JSON.stringify(payload);
    const signature = webhook.secret
      ? this.generateSignature(payloadString, webhook.secret)
      : undefined;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'BungeeHub-Webhooks/1.0',
    };

    if (signature) {
      headers['X-Webhook-Signature'] = signature;
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(
          `Webhook responded with status ${response.status}: ${response.statusText}`,
        );
      }

      this.logger.log(
        `Successfully sent webhook '${eventType}' to ${webhook.url}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send webhook '${eventType}' to ${webhook.url}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate HMAC SHA256 signature for webhook payload
   */
  private generateSignature(payload: string, secret: string): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== Helper Methods for Package/Delivery Events ====================

  /**
   * Fire package status updated event
   */
  async firePackageStatusUpdated(
    packageId: string,
    trackingNumber: string,
    newStatus: string,
    previousStatus: string,
  ) {
    await this.fireWebhookEvent('package.status.updated', {
      packageId,
      trackingNumber,
      status: newStatus,
      previousStatus,
    });
  }

  /**
   * Fire delivery completed event
   */
  async fireDeliveryCompleted(
    deliveryId: string,
    packageId: string,
    trackingNumber: string,
    hubId: string,
  ) {
    await this.fireWebhookEvent('delivery.completed', {
      deliveryId,
      packageId,
      trackingNumber,
      hubId,
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * Fire delivery failed event
   */
  async fireDeliveryFailed(
    deliveryId: string,
    packageId: string,
    trackingNumber: string,
    hubId: string,
    reason: string,
  ) {
    await this.fireWebhookEvent('delivery.failed', {
      deliveryId,
      packageId,
      trackingNumber,
      hubId,
      reason,
      failedAt: new Date().toISOString(),
    });
  }

  /**
   * Fire delivery status updated event
   */
  async fireDeliveryStatusUpdated(
    deliveryId: string,
    packageId: string,
    newStatus: string,
    previousStatus: string,
  ) {
    await this.fireWebhookEvent('delivery.status.updated', {
      deliveryId,
      packageId,
      status: newStatus,
      previousStatus,
    });
  }

  /**
   * Fire batch status updated event
   */
  async fireBatchStatusUpdated(
    batchId: string,
    batchNumber: string,
    newStatus: string,
    previousStatus: string,
  ) {
    await this.fireWebhookEvent('batch.status.updated', {
      batchId,
      batchNumber,
      status: newStatus,
      previousStatus,
    });
  }
}
