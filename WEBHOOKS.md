# DeliveryHub Webhook System

## Overview

The DeliveryHub webhook system allows external systems to receive real-time notifications when package and delivery events occur in the platform. This is essential for B2B integrations where third-party logistics systems need to stay synchronized with DeliveryHub.

## Features

- **Real-time Event Notifications**: Get instant updates when packages or deliveries change status
- **HMAC Signature Verification**: Secure webhook payloads with SHA-256 HMAC signatures
- **Flexible Event Subscription**: Subscribe to specific event types
- **Automatic Retry Logic**: Failed webhook deliveries are logged for troubleshooting
- **Multi-webhook Support**: Configure multiple webhook endpoints for different systems

## Supported Events

### Package Events

- `package.status.updated` - Fired when a package status changes
  ```json
  {
    "packageId": "uuid",
    "trackingNumber": "TRK123456",
    "status": "AT_HUB",
    "previousStatus": "IN_TRANSIT"
  }
  ```

### Delivery Events

- `delivery.status.updated` - Fired when a delivery status changes
  ```json
  {
    "deliveryId": "uuid",
    "packageId": "uuid",
    "status": "IN_PROGRESS",
    "previousStatus": "PENDING"
  }
  ```

- `delivery.completed` - Fired when a delivery is completed
  ```json
  {
    "deliveryId": "uuid",
    "packageId": "uuid",
    "trackingNumber": "TRK123456",
    "hubId": "uuid",
    "completedAt": "2025-11-17T12:00:00.000Z"
  }
  ```

- `delivery.failed` - Fired when a delivery fails
  ```json
  {
    "deliveryId": "uuid",
    "packageId": "uuid",
    "trackingNumber": "TRK123456",
    "hubId": "uuid",
    "reason": "Customer not available",
    "failedAt": "2025-11-17T12:00:00.000Z"
  }
  ```

### Batch Events

- `batch.status.updated` - Fired when a batch status changes
  ```json
  {
    "batchId": "uuid",
    "batchNumber": "BATCH-20251117-001",
    "status": "DELIVERED",
    "previousStatus": "IN_TRANSIT"
  }
  ```

## API Endpoints

All webhook management endpoints require **ADMIN** role authentication.

### Create Webhook

**POST** `/api/v1/webhooks`

```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Delivery Webhook",
    "url": "https://api.example.com/webhooks/deliveryhub",
    "events": [
      "package.status.updated",
      "delivery.completed",
      "delivery.failed"
    ],
    "secret": "whsec_1234567890abcdef",
    "active": true
  }'
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Production Delivery Webhook",
  "url": "https://api.example.com/webhooks/deliveryhub",
  "events": ["package.status.updated", "delivery.completed", "delivery.failed"],
  "secret": "whsec_1234567890abcdef",
  "active": true,
  "createdAt": "2025-11-17T12:00:00.000Z"
}
```

### List All Webhooks

**GET** `/api/v1/webhooks`

```bash
curl -X GET http://localhost:3000/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Webhook by ID

**GET** `/api/v1/webhooks/:id`

```bash
curl -X GET http://localhost:3000/api/v1/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Webhook

**PUT** `/api/v1/webhooks/:id`

```bash
curl -X PUT http://localhost:3000/api/v1/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "active": false
  }'
```

### Delete Webhook

**DELETE** `/api/v1/webhooks/:id`

```bash
curl -X DELETE http://localhost:3000/api/v1/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Webhook Payload Format

All webhook events follow this standard format:

```json
{
  "id": "evt_1700000000000_abc123xyz",
  "event": "delivery.completed",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "data": {
    "deliveryId": "uuid",
    "packageId": "uuid",
    "trackingNumber": "TRK123456",
    "hubId": "uuid",
    "completedAt": "2025-11-17T12:00:00.000Z"
  }
}
```

## Security - Signature Verification

Webhooks include an `X-Webhook-Signature` header containing an HMAC SHA-256 signature of the payload. Verify this signature to ensure the webhook came from DeliveryHub.

### Verification Example (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  return signature === expectedSignature;
}

// In your webhook endpoint
app.post('/webhooks/deliveryhub', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = 'whsec_1234567890abcdef';
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook event
  const event = req.body;
  console.log(`Received ${event.event} event`);

  res.json({ received: true });
});
```

### Verification Example (Python)

```python
import hmac
import hashlib

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected_signature = f"sha256={hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()}"
    return hmac.compare_digest(signature, expected_signature)

@app.route('/webhooks/deliveryhub', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Webhook-Signature')
    secret = 'whsec_1234567890abcdef'
    payload = request.get_data()

    if not verify_webhook_signature(payload, signature, secret):
        return jsonify({'error': 'Invalid signature'}), 401

    # Process webhook event
    event = request.get_json()
    print(f"Received {event['event']} event")

    return jsonify({'received': True})
```

## Testing Webhooks

### Using the Test Webhook Receiver

DeliveryHub includes a simple webhook receiver for testing:

```bash
# Start the test webhook receiver
node test-webhook-receiver.js 3001

# In another terminal, create a webhook pointing to it
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Test Webhook",
    "url": "http://localhost:3001",
    "events": ["package.status.updated", "delivery.completed"],
    "active": true
  }'
```

### Using webhook.site

For external testing, use [webhook.site](https://webhook.site):

1. Visit https://webhook.site
2. Copy your unique URL
3. Create a webhook in DeliveryHub using that URL
4. Trigger events and watch them appear on webhook.site

### Testing with ngrok

To test webhooks from your local machine:

```bash
# Start ngrok
ngrok http 3001

# Use the ngrok URL in your webhook configuration
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ngrok Test Webhook",
    "url": "https://YOUR-NGROK-ID.ngrok.io",
    "events": ["delivery.completed"],
    "active": true
  }'
```

## Best Practices

### 1. Respond Quickly

Your webhook endpoint should respond with a 2xx status code within 10 seconds. Process events asynchronously:

```javascript
app.post('/webhooks/deliveryhub', async (req, res) => {
  const event = req.body;

  // Respond immediately
  res.json({ received: true });

  // Process asynchronously
  processWebhookEvent(event).catch(console.error);
});
```

### 2. Handle Idempotency

Webhooks may be delivered more than once. Use the event `id` to track processed events:

```javascript
const processedEvents = new Set();

app.post('/webhooks/deliveryhub', async (req, res) => {
  const event = req.body;

  if (processedEvents.has(event.id)) {
    return res.json({ received: true, duplicate: true });
  }

  processedEvents.add(event.id);
  await processEvent(event);

  res.json({ received: true });
});
```

### 3. Implement Retry Logic

If your endpoint is down, DeliveryHub will log the failure. Implement a way to replay missed events:

```javascript
// Check your application logs for missed events
// Implement a manual replay endpoint if needed
```

### 4. Monitor Webhook Health

Track webhook delivery success rates and response times to detect issues early.

### 5. Secure Your Endpoint

- Always verify the signature
- Use HTTPS in production
- Implement rate limiting
- Log failed verification attempts

## Troubleshooting

### Webhooks Not Firing

1. Check if the webhook is active:
   ```bash
   curl -X GET http://localhost:3000/api/v1/webhooks/WEBHOOK_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. Check the event subscription matches the event type
3. Check application logs for errors
4. Verify the webhook URL is accessible

### Signature Verification Failing

1. Ensure you're using the raw request body (not parsed JSON)
2. Verify the secret matches exactly
3. Check that you're including the `sha256=` prefix
4. Ensure you're using HMAC SHA-256

### Timeouts

1. Ensure your endpoint responds within 10 seconds
2. Process events asynchronously
3. Return 200 OK immediately

## Event Flow Example

```
1. Package status updated in DeliveryHub
   └─> PackagesService.updatePackage()
       └─> WebhooksService.firePackageStatusUpdated()
           └─> Find all active webhooks subscribed to 'package.status.updated'
               └─> For each webhook:
                   ├─> Create payload with event data
                   ├─> Generate HMAC signature (if secret configured)
                   └─> POST to webhook URL
                       ├─> Success: Log event
                       └─> Failure: Log error
```

## Database Schema

```prisma
model WebhookConfig {
  id        String   @id @default(uuid())
  name      String
  url       String
  events    String[] // array of event types to subscribe to
  secret    String?  // for signature verification
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

## Integration Examples

### Shopify Integration

```javascript
// Sync DeliveryHub deliveries to Shopify fulfillments
app.post('/webhooks/deliveryhub', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'delivery.completed') {
    // Update Shopify order fulfillment
    await shopify.fulfillment.update(orderId, {
      status: 'delivered',
      tracking_number: data.trackingNumber,
      tracking_url: `https://deliveryhub.com/track/${data.trackingNumber}`
    });
  }

  res.json({ received: true });
});
```

### Slack Notifications

```javascript
// Send Slack notifications for failed deliveries
app.post('/webhooks/deliveryhub', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'delivery.failed') {
    await slack.chat.postMessage({
      channel: '#delivery-alerts',
      text: `🚨 Delivery failed: ${data.trackingNumber}\nReason: ${data.reason}`
    });
  }

  res.json({ received: true });
});
```

### Custom Analytics Dashboard

```javascript
// Track delivery metrics in real-time
app.post('/webhooks/deliveryhub', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'delivery.completed') {
    await analytics.track({
      event: 'delivery_completed',
      properties: {
        hub_id: data.hubId,
        package_id: data.packageId,
        timestamp: data.completedAt
      }
    });
  }

  res.json({ received: true });
});
```

## Support

For webhook-related issues:
- Check the [API Documentation](https://docs.deliveryhub.com/api)
- Review server logs for webhook delivery errors
- Contact support at support@deliveryhub.com
