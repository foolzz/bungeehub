# Database Schema & Data Models

## Overview

Complete database schema for BungeeHub including all entities, relationships, and indexes.

## Database Technology

**Primary Database**: PostgreSQL 14+
**Cache Layer**: Redis 6+
**Message Queue**: Redis Pub/Sub or RabbitMQ

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Users     │───┬───│  Players    │───────│  Sessions   │
└─────────────┘   │   └─────────────┘       └─────────────┘
                  │          │
                  │          │
┌─────────────┐   │          │               ┌─────────────┐
│   Roles     │───┘          ├───────────────│ Permissions │
└─────────────┘              │               └─────────────┘
                             │
                             │               ┌─────────────┐
┌─────────────┐              ├───────────────│ Punishments │
│   Servers   │──────────────┤               └─────────────┘
└─────────────┘              │
                             │               ┌─────────────┐
                             ├───────────────│ Transactions│
                             │               └─────────────┘
                             │
                             │               ┌─────────────┐
                             └───────────────│  Statistics │
                                             └─────────────┘
```

## Core Tables

### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(16) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255), -- For web dashboard access
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT username_length CHECK (LENGTH(username) >= 3)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

### Players
```sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE,
  username VARCHAR(16) NOT NULL,
  display_name VARCHAR(32),
  rank VARCHAR(50) DEFAULT 'default',
  balance DECIMAL(15,2) DEFAULT 0.00,
  first_join TIMESTAMP NOT NULL,
  last_seen TIMESTAMP,
  total_playtime INTEGER DEFAULT 0, -- in seconds
  total_joins INTEGER DEFAULT 0,
  ip_address INET,
  locale VARCHAR(10) DEFAULT 'en_US',
  is_online BOOLEAN DEFAULT false,
  current_server INTEGER REFERENCES servers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT balance_non_negative CHECK (balance >= 0)
);

CREATE INDEX idx_players_uuid ON players(uuid);
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_rank ON players(rank);
CREATE INDEX idx_players_is_online ON players(is_online);
CREATE INDEX idx_players_balance ON players(balance DESC);
CREATE INDEX idx_players_last_seen ON players(last_seen DESC);
```

### Servers
```sql
CREATE TABLE servers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  description TEXT,
  server_type VARCHAR(30), -- hub, survival, creative, minigame
  ip_address INET NOT NULL,
  port INTEGER NOT NULL,
  max_players INTEGER DEFAULT 100,
  motd TEXT,
  is_online BOOLEAN DEFAULT false,
  is_restricted BOOLEAN DEFAULT false,
  is_fallback BOOLEAN DEFAULT false,
  fallback_priority INTEGER DEFAULT 0,
  tags TEXT[], -- Array of tags
  metadata JSONB, -- Flexible storage for custom properties
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  CONSTRAINT port_range CHECK (port > 0 AND port <= 65535)
);

CREATE INDEX idx_servers_name ON servers(name);
CREATE INDEX idx_servers_type ON servers(server_type);
CREATE INDEX idx_servers_is_online ON servers(is_online);
CREATE INDEX idx_servers_tags ON servers USING GIN(tags);
```

### Sessions
```sql
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  server_id INTEGER REFERENCES servers(id),
  ip_address INET,
  device_id VARCHAR(64),
  minecraft_version VARCHAR(20),
  join_time TIMESTAMP NOT NULL,
  leave_time TIMESTAMP,
  duration INTEGER, -- in seconds, calculated on leave
  disconnect_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_player_id ON sessions(player_id);
CREATE INDEX idx_sessions_server_id ON sessions(server_id);
CREATE INDEX idx_sessions_join_time ON sessions(join_time DESC);
CREATE INDEX idx_sessions_ip_address ON sessions(ip_address);
```

### Permissions
```sql
CREATE TABLE permission_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  prefix VARCHAR(20),
  suffix VARCHAR(20),
  weight INTEGER DEFAULT 0, -- Higher weight = higher priority
  color VARCHAR(20),
  inherits_from INTEGER REFERENCES permission_groups(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_permissions (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  permission VARCHAR(255) NOT NULL,
  value BOOLEAN DEFAULT true, -- true = allow, false = deny
  server_id INTEGER REFERENCES servers(id), -- NULL = all servers
  expires_at TIMESTAMP,
  UNIQUE(group_id, permission, server_id)
);

CREATE TABLE player_groups (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, group_id)
);

CREATE TABLE player_permissions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  permission VARCHAR(255) NOT NULL,
  value BOOLEAN DEFAULT true,
  server_id INTEGER REFERENCES servers(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, permission, server_id)
);

CREATE INDEX idx_group_permissions_group ON group_permissions(group_id);
CREATE INDEX idx_player_groups_player ON player_groups(player_id);
CREATE INDEX idx_player_permissions_player ON player_permissions(player_id);
```

### Punishments
```sql
CREATE TABLE punishments (
  id BIGSERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- warn, kick, mute, ban, ipban
  reason TEXT NOT NULL,
  issued_by INTEGER REFERENCES users(id),
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- NULL = permanent
  is_active BOOLEAN DEFAULT true,
  removed_by INTEGER REFERENCES users(id),
  removed_at TIMESTAMP,
  removal_reason TEXT,
  ip_address INET, -- For IP bans
  server_id INTEGER REFERENCES servers(id), -- Server-specific punishment
  evidence JSONB, -- Screenshots, logs, etc.
  appeal_status VARCHAR(20), -- pending, approved, denied
  internal_note TEXT,
  CONSTRAINT type_check CHECK (type IN ('warn', 'kick', 'mute', 'ban', 'ipban'))
);

CREATE INDEX idx_punishments_player ON punishments(player_id);
CREATE INDEX idx_punishments_type ON punishments(type);
CREATE INDEX idx_punishments_is_active ON punishments(is_active);
CREATE INDEX idx_punishments_issued_at ON punishments(issued_at DESC);
CREATE INDEX idx_punishments_ip_address ON punishments(ip_address);
```

### Economy
```sql
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- earn, spend, transfer, admin
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- shop, rank, transfer, etc.
  related_player_id INTEGER REFERENCES players(id), -- For transfers
  server_id INTEGER REFERENCES servers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id), -- For admin transactions
  metadata JSONB,
  CONSTRAINT type_check CHECK (type IN ('earn', 'spend', 'transfer', 'admin'))
);

CREATE INDEX idx_transactions_player ON transactions(player_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
```

### Messages & Chat
```sql
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  server_id INTEGER NOT NULL REFERENCES servers(id),
  channel VARCHAR(50) DEFAULT 'global', -- global, local, staff
  message TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_player ON chat_messages(player_id);
CREATE INDEX idx_chat_server ON chat_messages(server_id);
CREATE INDEX idx_chat_channel ON chat_messages(channel);
CREATE INDEX idx_chat_created_at ON chat_messages(created_at DESC);

CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  message TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  interval_seconds INTEGER, -- For rotating announcements
  target_servers INTEGER[], -- Array of server IDs, NULL = all
  target_permissions TEXT[], -- Only show to players with these permissions
  is_active BOOLEAN DEFAULT true,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);
```

### Audit Logs
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- create_server, delete_player, etc.
  entity_type VARCHAR(50), -- server, player, permission, etc.
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
```

### Statistics
```sql
CREATE TABLE player_statistics (
  id BIGSERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  server_id INTEGER REFERENCES servers(id),
  stat_key VARCHAR(100) NOT NULL, -- blocks_broken, mobs_killed, etc.
  stat_value BIGINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, server_id, stat_key)
);

CREATE INDEX idx_player_stats_player ON player_statistics(player_id);
CREATE INDEX idx_player_stats_key ON player_statistics(stat_key);

CREATE TABLE server_metrics (
  id BIGSERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  metric_time TIMESTAMP NOT NULL,
  player_count INTEGER,
  tps DECIMAL(4,2),
  cpu_usage DECIMAL(5,2),
  memory_used BIGINT, -- in bytes
  memory_max BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_server_metrics_server ON server_metrics(server_id);
CREATE INDEX idx_server_metrics_time ON server_metrics(metric_time DESC);
```

### Configuration
```sql
CREATE TABLE network_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT,
  value_type VARCHAR(20), -- string, number, boolean, json
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Can be read via API
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id)
);

CREATE TABLE whitelist (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  uuid UUID NOT NULL UNIQUE,
  username VARCHAR(16) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  added_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_whitelist_uuid ON whitelist(uuid);

CREATE TABLE forced_hosts (
  id SERIAL PRIMARY KEY,
  host VARCHAR(255) NOT NULL UNIQUE,
  target_server_id INTEGER NOT NULL REFERENCES servers(id),
  priority INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forced_hosts_host ON forced_hosts(host);
```

### API & Webhooks
```sql
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permissions TEXT[], -- Array of allowed permissions
  rate_limit INTEGER DEFAULT 1000, -- requests per hour
  ip_whitelist INET[],
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);

CREATE TABLE webhooks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255), -- For signature verification
  events TEXT[], -- Array of event types to listen for
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 5000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_code INTEGER,
  response_body TEXT,
  delivery_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event_type);
```

## Data Relationships

### One-to-Many
- **Users → AuditLogs**: One user creates many audit entries
- **Players → Sessions**: One player has many sessions
- **Players → Transactions**: One player has many transactions
- **Players → Punishments**: One player can have many punishments
- **Servers → Sessions**: One server hosts many sessions
- **PermissionGroups → GroupPermissions**: One group has many permissions

### Many-to-Many
- **Players ↔ PermissionGroups**: via `player_groups` table
- **Players ↔ Servers**: Players can join multiple servers, servers host multiple players (tracked via sessions)

### Self-Referencing
- **PermissionGroups.inherits_from**: Groups can inherit from other groups

## Indexes Strategy

### Performance Indexes
- Foreign keys (automatic in PostgreSQL)
- Frequently queried columns (username, uuid, ip_address)
- Sort columns (created_at DESC, balance DESC)
- Filter columns (is_active, is_online, type)

### Composite Indexes
```sql
CREATE INDEX idx_sessions_player_server ON sessions(player_id, server_id);
CREATE INDEX idx_active_punishments ON punishments(player_id, is_active, type);
```

### GIN Indexes (for arrays/JSONB)
```sql
CREATE INDEX idx_servers_metadata ON servers USING GIN(metadata);
CREATE INDEX idx_api_keys_permissions ON api_keys USING GIN(permissions);
```

## Data Retention Policies

- **Chat Messages**: 90 days
- **Sessions**: Indefinite (aggregate old data)
- **Audit Logs**: 1 year
- **Server Metrics**: 7 days raw, 90 days aggregated
- **Webhook Deliveries**: 30 days

## Backup Strategy

- **Full Backup**: Daily at 2 AM
- **Incremental Backup**: Every 6 hours
- **Point-in-Time Recovery**: Enabled
- **Retention**: 30 days

## Migration Strategy

- Use migration tool (Prisma Migrate, Flyway, or Alembic)
- Version control all schema changes
- Test migrations on staging first
- Rollback plan for each migration

---

**Next Document:** [11-PERMISSIONS.md](./11-PERMISSIONS.md)
