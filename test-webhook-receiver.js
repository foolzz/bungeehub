/**
 * Simple Webhook Receiver for Testing
 *
 * This script starts a simple HTTP server that receives webhook events
 * and logs them to the console. Useful for testing the webhook system.
 *
 * Usage:
 *   node test-webhook-receiver.js [port]
 *
 * Default port: 3001
 */

const http = require('http');
const crypto = require('crypto');

const PORT = process.argv[2] || 3001;

// Verify webhook signature (if secret is provided)
function verifySignature(payload, signature, secret) {
  if (!signature || !secret) {
    return true; // Skip verification if no secret configured
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  return signature === expectedSignature;
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const signature = req.headers['x-webhook-signature'];
        const secret = process.env.WEBHOOK_SECRET; // Optional

        // Verify signature if secret is set
        if (secret && !verifySignature(body, signature, secret)) {
          console.error('❌ Webhook signature verification failed!');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid signature' }));
          return;
        }

        const event = JSON.parse(body);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📨 Webhook Event Received');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🆔 Event ID: ${event.id}`);
        console.log(`📅 Timestamp: ${event.timestamp}`);
        console.log(`🏷️  Event Type: ${event.event}`);
        console.log('📦 Event Data:');
        console.log(JSON.stringify(event.data, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Respond with 200 OK
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true, eventId: event.id }));
      } catch (error) {
        console.error('❌ Error processing webhook:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else if (req.method === 'GET') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Webhook receiver is running',
      port: PORT
    }));
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

server.listen(PORT, () => {
  console.log('🚀 Webhook Receiver Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Waiting for webhook events...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down webhook receiver...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
