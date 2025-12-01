# Dashboard Page Mockup

## Overview

The Dashboard is the main landing page after login. It provides a comprehensive overview of the entire network status, key metrics, and quick access to common actions.

## Page Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ BungeeHub Network Dashboard                    🔄 Auto-refresh: ON      │
│                                           Last updated: 2 seconds ago    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ 🟢 ONLINE   │  │ 👥 PLAYERS  │  │ ⚡ SERVERS  │  │ 💾 MEMORY   │   │
│  │             │  │             │  │             │  │             │   │
│  │     ✓       │  │   247/500   │  │   12/15     │  │  24.3/64GB  │   │
│  │  Network    │  │   49.4%     │  │   80%       │  │  38%        │   │
│  │  Healthy    │  │             │  │             │  │             │   │
│  │             │  │ ▓▓▓▓▓░░░░░  │  │ ▓▓▓▓▓▓▓▓░░  │  │ ▓▓▓▓░░░░░░  │   │
│  │             │  │ ↑ +12 (5m)  │  │ 3 offline   │  │ ⚠ 2 high    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────┐  ┌────────────────┐  │
│  │ Server Status Grid                           │  │ Quick Actions  │  │
│  ├──────────────────────────────────────────────┤  ├────────────────┤  │
│  │                                              │  │                │  │
│  │  🟢 Hub-1        👥 89    💾 4.2G   ⚡ 20TPS │  │ [+ Add Server] │  │
│  │     Main Lobby           📊 CPU: 23%        │  │                │  │
│  │     ┗━ 12.4.56.78:25577                     │  │ [📢 Broadcast] │  │
│  │                                              │  │                │  │
│  │  🟢 Hub-2        👥 67    💾 3.8G   ⚡ 20TPS │  │ [🔍 Find Plyr] │  │
│  │     Backup Lobby         📊 CPU: 19%        │  │                │  │
│  │     ┗━ 12.4.56.78:25578                     │  │ [👤 View All]  │  │
│  │                                              │  │                │  │
│  │  🟢 Survival     👥 45    💾 8.1G   ⚡ 19TPS │  │ [⚙ Settings]   │  │
│  │     Main SMP             📊 CPU: 56%        │  │                │  │
│  │     ┗━ 12.4.56.79:25565                     │  │ [📋 Logs]      │  │
│  │                                              │  │                │  │
│  │  🟡 Minigames    👥 31    💾 5.2G   ⚡ 17TPS │  │                │  │
│  │     ⚠ Low TPS            📊 CPU: 67%  ⚠    │  └────────────────┘  │
│  │     ┗━ 12.4.56.79:25566                     │                      │
│  │                                              │  ┌────────────────┐  │
│  │  🟢 Creative     👥 12    💾 2.1G   ⚡ 20TPS │  │ System Health  │  │
│  │     Creative World       📊 CPU: 12%        │  ├────────────────┤  │
│  │     ┗━ 12.4.56.79:25567                     │  │ Proxy CPU      │  │
│  │                                              │  │ ▓▓░░░░ 34%     │  │
│  │  🔴 Skyblock     👥 0     💾 0.0G   ⚡ --    │  │                │  │
│  │     ✗ Offline            Maintenance        │  │ Proxy Memory   │  │
│  │     ┗━ 12.4.56.79:25568                     │  │ ▓▓▓░░░ 45%     │  │
│  │                                              │  │                │  │
│  │  🔴 Events       👥 0     💾 0.0G   ⚡ --    │  │ Database       │  │
│  │     ✗ Offline            Scheduled: 6PM     │  │ ▓░░░░░ 12%     │  │
│  │     ┗━ 12.4.56.80:25565                     │  │                │  │
│  │                                              │  │ Redis          │  │
│  │                               [View All →]   │  │ ▓░░░░░ 8%      │  │
│  └──────────────────────────────────────────────┘  └────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────┐  ┌──────────────────────────┐   │
│  │ Network Activity (Last 24 Hours)  │  │ Recent Events            │   │
│  ├───────────────────────────────────┤  ├──────────────────────────┤   │
│  │ Players                           │  │                          │   │
│  │ 500│          ╱╲                  │  │ 🔴 Skyblock went offline │   │
│  │    │         ╱  ╲      ╱╲         │  │    2 minutes ago         │   │
│  │ 300│    ╱╲  ╱    ╲    ╱  ╲        │  │                          │   │
│  │    │   ╱  ╲╱      ╲  ╱    ╲       │  │ 👤 Player123 banned      │   │
│  │ 100│  ╱            ╲╱      ╲      │  │    by Admin, 5m ago      │   │
│  │   0└────────────────────────────  │  │                          │   │
│  │    12AM  6AM  12PM  6PM  12AM     │  │ 🟢 Hub-2 started         │   │
│  │                                   │  │    12 minutes ago        │   │
│  │ Legend: ─ Players  ┄ New Joins   │  │                          │   │
│  └───────────────────────────────────┘  │ 💰 Economy sync complete │   │
│                                          │    15 minutes ago        │   │
│  ┌───────────────────────────────────┐  │                          │   │
│  │ Top Players (This Week)           │  │ ⚠ Minigames low TPS      │   │
│  ├───────────────────────────────────┤  │    18 minutes ago        │   │
│  │ 1. 👑 PlayerOne    24h 32m        │  │                          │   │
│  │ 2. 🥈 CoolGamer    22h 15m        │  │ 👥 247 players online    │   │
│  │ 3. 🥉 MinecraftPro 19h 48m        │  │    30 minutes ago        │   │
│  │ 4.    BuildMaster  17h 22m        │  │                          │   │
│  │ 5.    RedstoneGuy  16h 54m        │  │            [View All →]  │   │
│  └───────────────────────────────────┘  └──────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Performance Metrics (Last Hour)                                  │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  TPS (Ticks Per Second)                 CPU Usage (%)            │   │
│  │  20│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       100│          ╱╲              │   │
│  │  15│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░       75│         ╱  ╲╱╲           │   │
│  │  10│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░       50│    ╱╲  ╱      ╲          │   │
│  │   5│ ░░░░░░░░░░░░░░░░░░░░░░       25│ ╱╲╱  ╲╱        ╲╱╲       │   │
│  │      ─────────────────────           └──────────────────────     │   │
│  │      All servers healthy              Average: 45%              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Components Breakdown

### 1. Header Section
```
┌──────────────────────────────────────────────────────────────────┐
│ BungeeHub Network Dashboard         🔄 Auto-refresh: ON          │
│                               Last updated: 2 seconds ago         │
└──────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Page title
- Auto-refresh toggle (ON/OFF)
- Manual refresh button
- Last update timestamp
- Settings icon (refresh interval, widget layout)

### 2. Key Metrics Cards

#### Card 1: Network Status
```
┌─────────────┐
│ 🟢 ONLINE   │
│             │
│     ✓       │
│  Network    │
│  Healthy    │
│             │
└─────────────┘
```
**States:**
- 🟢 ONLINE - All systems operational
- 🟡 DEGRADED - Some issues detected
- 🔴 OFFLINE - Critical failure
- 🔵 MAINTENANCE - Scheduled maintenance

**Details on Click:**
- System component statuses
- Recent outages
- Uptime percentage

#### Card 2: Player Count
```
┌─────────────┐
│ 👥 PLAYERS  │
│             │
│   247/500   │
│   49.4%     │
│             │
│ ▓▓▓▓▓░░░░░  │
│ ↑ +12 (5m)  │
└─────────────┘
```
**Shows:**
- Current/Maximum players
- Percentage filled
- Visual bar indicator
- Trend (up/down arrow)
- Change in last 5 minutes

**Color Coding:**
- Green: < 70%
- Yellow: 70-90%
- Red: > 90%

#### Card 3: Server Count
```
┌─────────────┐
│ ⚡ SERVERS  │
│             │
│   12/15     │
│   80%       │
│             │
│ ▓▓▓▓▓▓▓▓░░  │
│ 3 offline   │
└─────────────┘
```
**Shows:**
- Online/Total servers
- Percentage online
- Visual indicator
- Count of offline servers
- Click to view server list

#### Card 4: Memory Usage
```
┌─────────────┐
│ 💾 MEMORY   │
│             │
│  24.3/64GB  │
│  38%        │
│             │
│ ▓▓▓▓░░░░░░  │
│ ⚠ 2 high    │
└─────────────┘
```
**Shows:**
- Used/Total memory
- Percentage used
- Visual bar
- Alert if any server > 90%
- Click for detailed breakdown

### 3. Server Status Grid

**Each Server Row Shows:**
```
🟢 Hub-1        👥 89    💾 4.2G   ⚡ 20TPS
   Main Lobby           📊 CPU: 23%
   ┗━ 12.4.56.78:25577
```

**Information:**
1. Status indicator (🟢🟡🔴)
2. Server name (clickable)
3. Player count (👥)
4. Memory usage (💾)
5. TPS (Ticks Per Second) ⚡
6. Description/tag
7. CPU usage
8. IP address
9. Hover actions: Quick restart, View details, Send players

**Status Colors:**
- 🟢 Green: Healthy (TPS ≥ 19, CPU < 80%)
- 🟡 Yellow: Warning (TPS 15-18 or CPU 80-95%)
- 🔴 Red: Critical (TPS < 15 or CPU > 95% or Offline)

**Row Actions (Right-click or ••• menu):**
- View Details
- Manage Server
- Send Players Here
- Restart Server
- View Logs
- Edit Configuration

**Grid Controls:**
- Sort by: Name, Players, Status, CPU, Memory
- Filter: Show All / Only Online / Only Problems
- View: Grid / List / Compact
- Search server names

### 4. Quick Actions Panel
```
┌────────────────┐
│ Quick Actions  │
├────────────────┤
│ [+ Add Server] │
│ [📢 Broadcast] │
│ [🔍 Find Plyr] │
│ [👤 View All]  │
│ [⚙ Settings]   │
│ [📋 Logs]      │
└────────────────┘
```

**Actions:**
1. **Add Server** - Quick add server modal
2. **Broadcast** - Send network-wide message
3. **Find Player** - Search for player
4. **View All Players** - Go to player list
5. **Settings** - Network settings
6. **Logs** - View recent logs

### 5. System Health Widget
```
┌────────────────┐
│ System Health  │
├────────────────┤
│ Proxy CPU      │
│ ▓▓░░░░ 34%     │
│                │
│ Proxy Memory   │
│ ▓▓▓░░░ 45%     │
│                │
│ Database       │
│ ▓░░░░░ 12%     │
│                │
│ Redis          │
│ ▓░░░░░ 8%      │
└────────────────┘
```

**Monitors:**
- BungeeCord Proxy resources
- Database performance
- Redis cache status
- Network latency
- Disk usage

**Click for:**
- Detailed metrics
- Historical graphs
- Alert configuration

### 6. Network Activity Graph
```
┌───────────────────────────────────┐
│ Network Activity (Last 24 Hours)  │
├───────────────────────────────────┤
│ Players                           │
│ 500│          ╱╲                  │
│    │         ╱  ╲      ╱╲         │
│ 300│    ╱╲  ╱    ╲    ╱  ╲        │
│    │   ╱  ╲╱      ╲  ╱    ╲       │
│ 100│  ╱            ╲╱      ╲      │
│   0└────────────────────────────  │
│    12AM  6AM  12PM  6PM  12AM     │
└───────────────────────────────────┘
```

**Features:**
- Time range selector (1h, 6h, 24h, 7d, 30d)
- Multiple metrics overlay:
  - Total players (solid line)
  - New joins (dotted line)
  - Server count (optional)
- Hover to see exact values
- Click point to see details
- Export graph as image

### 7. Recent Events Feed
```
┌──────────────────────────┐
│ Recent Events            │
├──────────────────────────┤
│ 🔴 Skyblock went offline │
│    2 minutes ago         │
│                          │
│ 👤 Player123 banned      │
│    by Admin, 5m ago      │
│                          │
│ 🟢 Hub-2 started         │
│    12 minutes ago        │
└──────────────────────────┘
```

**Event Types:**
- Server status changes (start/stop/crash)
- Player actions (join/leave/ban/kick)
- Economy transactions (large)
- System alerts
- Configuration changes
- Performance warnings

**Features:**
- Auto-updates via WebSocket
- Filter by event type
- Click event for details
- "View All" link to full event log
- Color-coded by severity

### 8. Top Players Widget
```
┌───────────────────────────────────┐
│ Top Players (This Week)           │
├───────────────────────────────────┤
│ 1. 👑 PlayerOne    24h 32m        │
│ 2. 🥈 CoolGamer    22h 15m        │
│ 3. 🥉 MinecraftPro 19h 48m        │
│ 4.    BuildMaster  17h 22m        │
│ 5.    RedstoneGuy  16h 54m        │
└───────────────────────────────────┘
```

**Metrics:**
- Play time
- Most active
- Richest players
- Most social

**Time Ranges:**
- Today
- This Week
- This Month
- All Time

**Click player to:**
- View profile
- Send message
- Manage permissions

### 9. Performance Metrics
```
┌──────────────────────────────────────────────────┐
│ Performance Metrics (Last Hour)                  │
├──────────────────────────────────────────────────┤
│  TPS (Ticks Per Second)      CPU Usage (%)       │
│  [Bar charts showing metrics]                    │
└──────────────────────────────────────────────────┘
```

**Tracks:**
- Average TPS across all servers
- CPU usage per server
- Memory trends
- Network bandwidth
- Database query time

## Real-Time Updates

**Auto-Refresh Intervals:**
- Key metrics: Every 2 seconds
- Server grid: Every 5 seconds
- Graphs: Every 30 seconds
- Events feed: Real-time (WebSocket)

**User Controls:**
- Enable/disable auto-refresh
- Adjust refresh interval (1s - 60s)
- Manual refresh button
- Pause updates while interacting

## Responsive Behavior

### Desktop (> 1200px)
- 4-column metric cards
- 2-column widget layout below
- Full server grid visible

### Tablet (768px - 1200px)
- 2-column metric cards
- Single column widgets
- Scrollable server grid

### Mobile (< 768px)
- Single column layout
- Compact server cards
- Collapsible widgets
- Essential metrics only

## Customization Options

**Widget Configuration:**
- Show/hide widgets
- Rearrange widget order (drag & drop)
- Resize widgets
- Choose which metrics to display
- Save layout per user

**Preferences:**
- Default time range for graphs
- Metric update frequency
- Event filter preferences
- Theme (light/dark)
- Compact/comfortable view density

## User Permissions

Different users see different information:

**Owner/Admin:**
- All widgets and metrics
- All server controls
- System health info

**Moderator:**
- Player metrics and activity
- Limited server info (no system metrics)
- No system health widget

**Support:**
- Read-only view
- Player info only
- No server controls

## Empty States

**No Servers:**
```
┌────────────────────────────────┐
│                                │
│        ⚡                       │
│   No Servers Connected         │
│                                │
│   Get started by adding your   │
│   first server to the network  │
│                                │
│      [+ Add Your First Server] │
│                                │
└────────────────────────────────┘
```

**No Players:**
```
┌────────────────────────────────┐
│        👥                       │
│   No Players Online            │
│                                │
│   Waiting for players to join  │
│   Check MOTD and whitelist     │
└────────────────────────────────┘
```

## Error States

**Server Connection Lost:**
```
┌────────────────────────────────────┐
│ ⚠ Connection Lost                  │
│                                    │
│ Cannot connect to BungeeCord proxy │
│ Attempting to reconnect...         │
│                                    │
│ [Retry Now] [Check Status]         │
└────────────────────────────────────┘
```

**API Error:**
```
┌────────────────────────────────────┐
│ ⚠ Unable to Load Data              │
│                                    │
│ Error: API timeout                 │
│                                    │
│ [Retry] [Report Issue]             │
└────────────────────────────────────┘
```

## Implementation Notes

1. **Real-time Updates:**
   - Use WebSocket for server status and events
   - Fallback to polling if WebSocket unavailable
   - Implement reconnection logic

2. **Performance:**
   - Lazy load widgets below fold
   - Debounce auto-refresh
   - Cache graph data
   - Virtual scrolling for long server lists

3. **Data Fetching:**
   - Initial load: Fetch all data
   - Updates: Only changed data
   - Use SWR or React Query for caching

4. **Charts:**
   - Use Recharts or Chart.js
   - Responsive and accessible
   - Export capability

5. **State Management:**
   - Dashboard state in Redux/Zustand
   - Persist user preferences
   - Optimistic UI updates

---

**Next Document:** [03-SERVERS.md](./03-SERVERS.md)
