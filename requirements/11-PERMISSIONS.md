# User Roles & Permissions Matrix

## Overview

Comprehensive role-based access control (RBAC) system defining permissions for different user types in the BungeeHub management system.

## User Roles Hierarchy

```
Owner (Super Admin)
    ├── Administrator
    │   ├── Moderator
    │   │   └── Support
    │   └── Developer
    └── Manager
```

## Role Definitions

### 1. Owner (Super Admin)
**Description**: Full unrestricted access to all features and settings
**Cannot be removed or demoted**: Yes
**Count**: Usually 1, maximum 2-3

### 2. Administrator
**Description**: Nearly full access, can manage most aspects of the network
**Can be promoted/demoted by**: Owner
**Count**: 2-5

### 3. Manager
**Description**: Business operations, economy, and content management
**Can be promoted/demoted by**: Owner, Administrator
**Count**: 3-10

### 4. Developer
**Description**: Technical access for development and debugging
**Can be promoted/demoted by**: Owner, Administrator
**Count**: 2-5

### 5. Moderator
**Description**: Player management and moderation duties
**Can be promoted/demoted by**: Owner, Administrator, Manager
**Count**: 10-20

### 6. Support
**Description**: Limited player assistance capabilities
**Can be promoted/demoted by**: Owner, Administrator, Manager, Moderator
**Count**: Unlimited

### 7. Viewer
**Description**: Read-only access to statistics and information
**Can be promoted/demoted by**: Owner, Administrator, Manager
**Count**: Unlimited

## Permissions Matrix

| Permission Category | Owner | Admin | Manager | Developer | Moderator | Support | Viewer |
|---------------------|-------|-------|---------|-----------|-----------|---------|--------|
| **DASHBOARD** |
| View Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Customize Widgets | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **SERVERS** |
| View Server List | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Server Details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add Server | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Edit Server | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Delete Server | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Restart Server | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Stop Server | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| View Server Logs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit Server Files | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| **PLAYERS** |
| View Player List | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Player Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Player Statistics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Send Message to Player | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Kick Player | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Warn Player | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Mute Player (Temp) | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Mute Player (Perm) | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Ban Player (Temp) | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Ban Player (Perm) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| IP Ban | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Unban Player | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| View Punishment History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add Admin Note | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View Admin Notes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View Alt Accounts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View IP History | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Send Player to Server | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| **PERMISSIONS** |
| View Permission Groups | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create Permission Group | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Edit Permission Group | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Delete Permission Group | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Player Permissions | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Edit Player Permissions | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Assign Groups to Players | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **ECONOMY** |
| View Balances | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| View Transactions | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| View Economy Reports | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| Add Money to Player | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Remove Money from Player | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Set Player Balance | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage Shop | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Configure Economy | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Economy Reset | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **NETWORK** |
| View Network Config | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit Network Config | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Edit MOTD | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage Whitelist | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Enable Maintenance | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Configure Forced Hosts | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| **MESSAGING** |
| Send Network Broadcast | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Send Server Broadcast | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| View Chat History | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Delete Chat Messages | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Manage Announcements | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Configure Chat Filter | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **MONITORING** |
| View Analytics | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| View Logs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Export Logs | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Configure Alerts | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| View Performance Metrics | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Create Custom Dashboards | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| **API** |
| View API Documentation | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Create API Keys | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Manage API Keys | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| View API Usage | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Configure Webhooks | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| **USER MANAGEMENT** |
| View Users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Create Users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Edit Users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Delete Users | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Assign Roles | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Audit Logs | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| **SYSTEM** |
| System Settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Backup/Restore | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Update System | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View System Info | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Database Access | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Execute Console Commands | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |

## Permission Naming Convention

Permissions follow a hierarchical dot-notation format:

```
bungeehub.<category>.<subcategory>.<action>
```

### Examples:
```
bungeehub.servers.view
bungeehub.servers.create
bungeehub.servers.delete
bungeehub.players.view
bungeehub.players.ban.temp
bungeehub.players.ban.permanent
bungeehub.economy.balance.view
bungeehub.economy.balance.edit
bungeehub.network.config.edit
bungeehub.api.keys.create
```

### Wildcard Permissions:
```
bungeehub.*                     # All permissions
bungeehub.servers.*             # All server permissions
bungeehub.players.ban.*         # All ban-related permissions
```

## Special Permissions

### Bypass Permissions
- `bungeehub.bypass.whitelist` - Join when whitelist enabled
- `bungeehub.bypass.maintenance` - Join during maintenance mode
- `bungeehub.bypass.serverfull` - Join full servers
- `bungeehub.bypass.chatfilter` - Bypass chat filtering

### Developer Permissions
- `bungeehub.debug.mode` - Enable debug mode
- `bungeehub.debug.logs` - View detailed logs
- `bungeehub.console.execute` - Execute console commands
- `bungeehub.database.access` - Direct database access

### Economy Permissions
- `bungeehub.economy.shop.discount.10` - 10% shop discount
- `bungeehub.economy.shop.discount.25` - 25% shop discount
- `bungeehub.economy.transfer.limit.none` - No transfer limit

## Role Assignment Rules

### Automatic Assignment
- New dashboard users: **Viewer** role by default
- Email verification required before upgrade
- Time-based probation period for Support/Moderator

### Promotion Requirements

**To Support:**
- Must have account for 7+ days
- Email verified
- Completed training (optional)

**To Moderator:**
- Must be Support for 30+ days
- Recommendation from Admin
- Passed moderation quiz

**To Manager:**
- Must be with organization for 90+ days
- Recommendation from Owner
- Business operations training

**To Administrator:**
- Must be with organization for 180+ days
- Proven track record
- Owner approval required

## Permission Inheritance

Roles inherit permissions from lower roles:

```
Owner inherits from → Admin
Admin inherits from → Manager + Developer
Manager inherits from → Moderator
Moderator inherits from → Support
Support inherits from → Viewer
```

## Temporary Permissions

Permissions can be granted temporarily with expiration:

```json
{
  "permission": "bungeehub.servers.restart",
  "granted_at": "2025-11-18T10:00:00Z",
  "expires_at": "2025-11-25T10:00:00Z",
  "granted_by": "owner_username"
}
```

## Server-Specific Permissions

Permissions can be scoped to specific servers:

```json
{
  "permission": "bungeehub.players.ban.temp",
  "server": "Hub-1",
  "description": "Can only ban on Hub-1"
}
```

## Permission Groups for Players

Player ranks (VIP, MVP, etc.) also use permission groups:

| Player Rank | Permissions |
|-------------|-------------|
| Default | Basic gameplay |
| VIP | Chat colors, join full servers, 2 homes |
| VIP+ | Above + fly in hub, 5 homes, no chat delay |
| MVP | Above + pet cosmetics, 10 homes, /nick |
| MVP+ | Above + particle effects, unlimited homes |
| Staff | Moderation commands |

## Two-Factor Authentication

### Required Roles
- Owner: **Mandatory**
- Administrator: **Mandatory**
- Manager: **Recommended**
- Developer: **Recommended**
- Other roles: **Optional**

### Enforcement
- Cannot access system without 2FA if mandatory
- Grace period: 7 days to set up
- Recovery codes provided
- Backup authentication methods

## Session Management

### Session Duration
- Owner/Admin: 8 hours
- Manager/Developer: 12 hours
- Moderator/Support: 24 hours
- Viewer: 7 days

### Concurrent Sessions
- Owners: Max 3 sessions
- Admins: Max 3 sessions
- Others: Max 2 sessions

### Session Security
- IP address tracking
- Device fingerprinting
- Unusual activity detection
- Force logout capability

## Audit Trail

All permission-related actions are logged:
- Permission grants
- Permission revocations
- Role assignments
- Role changes
- Permission group modifications
- Access attempts (successful and failed)

## Implementation Notes

### Backend
- Use middleware to check permissions on all routes
- Cache user permissions in Redis
- Invalidate cache on permission changes
- Check permissions at multiple levels (route, controller, service)

### Frontend
- Hide UI elements user doesn't have permission for
- Always verify on backend (never trust frontend)
- Show permission denied messages clearly
- Provide contact info for permission requests

### Testing
- Unit tests for permission checker
- Integration tests for role-based access
- Test permission inheritance
- Test temporary permission expiration
- Test server-specific permissions

---

**End of Requirements Documentation**

For questions or clarifications, please review the relevant section or contact the project team.
