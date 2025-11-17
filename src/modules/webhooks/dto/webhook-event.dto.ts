export interface WebhookEventDto {
  id: string;
  event: string;
  timestamp: string;
  data: {
    packageId?: string;
    deliveryId?: string;
    batchId?: string;
    hubId?: string;
    trackingNumber?: string;
    status?: string;
    previousStatus?: string;
    [key: string]: any;
  };
}
