# API Documentation & Integrations

## Overview

RESTful API for external integrations, webhooks, third-party tools, and custom applications.

## API Architecture

### Base URL
```
https://api.bungeehub.example.com/v1
```

### Authentication
- **JWT Tokens** for user authentication
- **API Keys** for service-to-service communication
- **OAuth 2.0** for third-party applications
- **Rate Limiting**: 1000 requests/hour per key

### Response Format
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2025-11-18T18:45:32Z",
    "version": "1.0.0"
  }
}
```

## Core Endpoints

### Servers
```
GET    /servers                 - List all servers
GET    /servers/{id}            - Get server details
POST   /servers                 - Add new server
PUT    /servers/{id}            - Update server
DELETE /servers/{id}            - Remove server
GET    /servers/{id}/players    - List players on server
POST   /servers/{id}/restart    - Restart server
GET    /servers/{id}/logs       - Get server logs
```

### Players
```
GET    /players                 - List all players
GET    /players/{uuid}          - Get player details
GET    /players/{uuid}/stats    - Player statistics
GET    /players/{uuid}/sessions - Session history
POST   /players/{uuid}/kick     - Kick player
POST   /players/{uuid}/ban      - Ban player
POST   /players/{uuid}/mute     - Mute player
GET    /players/{uuid}/economy  - Player economy data
PUT    /players/{uuid}/balance  - Update balance
```

### Network
```
GET    /network/status          - Network overview
GET    /network/config          - Network configuration
PUT    /network/config          - Update configuration
POST   /network/broadcast       - Send broadcast
GET    /network/analytics       - Network analytics
```

### Economy
```
GET    /economy/balances        - All player balances
GET    /economy/transactions    - Transaction history
POST   /economy/transfer        - Transfer between players
GET    /economy/leaderboard     - Top balances
```

### Permissions
```
GET    /permissions/groups      - List all groups
POST   /permissions/groups      - Create group
GET    /players/{uuid}/perms    - Player permissions
POST   /players/{uuid}/perms    - Add permission
DELETE /players/{uuid}/perms/{id} - Remove permission
```

## Webhooks

### Webhook Events
```
player.join
player.leave
player.banned
player.unbanned
server.start
server.stop
server.crash
economy.transaction
chat.message
punishment.issued
```

### Webhook Payload
```json
{
  "event": "player.join",
  "timestamp": "2025-11-18T18:45:32Z",
  "data": {
    "player": {
      "uuid": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
      "username": "PlayerOne",
      "ip": "127.0.0.1"
    },
    "server": "Hub-1"
  }
}
```

### Webhook Configuration
- URL endpoint
- Secret key for signature verification
- Event filters
- Retry policy
- Timeout settings

## API Keys Management

### Key Types
- **Read-Only**: GET requests only
- **Read-Write**: All operations
- **Admin**: Full access including deletions

### Key Features
- Revocable at any time
- Expiration dates
- IP whitelisting
- Rate limit customization
- Usage analytics

## SDK & Libraries

### Official SDKs
- JavaScript/TypeScript
- Python
- Java
- PHP
- Go

### Example Usage (JavaScript)
```javascript
import { BungeeHubClient } from '@bungeehub/api';

const client = new BungeeHubClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.bungeehub.example.com'
});

// Get all servers
const servers = await client.servers.list();

// Get player details
const player = await client.players.get('uuid-here');

// Send broadcast
await client.network.broadcast({
  message: 'Server restarting in 5 minutes!',
  servers: ['Hub-1', 'Survival']
});
```

## Third-Party Integrations

### Discord Bot
- Player status commands
- Server status commands
- Link Minecraft account
- Sync roles with in-game ranks
- Announcements from game to Discord
- Chat bridge

### Website Integration
- Player stats display
- Server status widget
- Leaderboards
- Shop integration
- Vote rewards

### Monitoring Tools
- Grafana dashboards
- Prometheus metrics
- DataDog integration
- New Relic APM

### Payment Gateways
- PayPal
- Stripe
- Tebex/Buycraft
- Custom donation systems

## Rate Limiting

### Limits by Tier
- **Free**: 100 requests/hour
- **Basic**: 1,000 requests/hour
- **Pro**: 10,000 requests/hour
- **Enterprise**: Unlimited

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1637251200
```

## Error Codes

```
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```

## API Documentation UI

- **Swagger/OpenAPI** specification
- Interactive API explorer
- Code examples in multiple languages
- Try-it-out functionality
- Authentication testing
- Response schema visualization

## Security

- HTTPS only
- API key rotation
- Request signing
- IP whitelisting
- CORS configuration
- SQL injection prevention
- Rate limiting
- Audit logging

---

**Next Document:** [10-DATA-MODELS.md](./10-DATA-MODELS.md)
