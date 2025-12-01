import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({
    description: 'Name of the webhook',
    example: 'Production Delivery Webhook',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'URL endpoint to send webhook events to',
    example: 'https://api.example.com/webhooks/deliveryhub',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'Array of event types to subscribe to',
    example: ['package.status.updated', 'delivery.completed', 'delivery.failed'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiProperty({
    description: 'Secret key for HMAC signature verification (optional)',
    example: 'whsec_1234567890abcdef',
    required: false,
  })
  @IsString()
  @IsOptional()
  secret?: string;

  @ApiProperty({
    description: 'Whether the webhook is active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
