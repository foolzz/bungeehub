# Navigation & Layout Mockup

## Application Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  BungeeHub                    [Search...]    [🔔] [👤 Admin] [⚙]   │ <- Top Bar
├─────────────────────────────────────────────────────────────────────┤
│         │                                                            │
│  MENU   │                    CONTENT AREA                           │
│         │                                                            │
│  Home   │  ┌──────────────────────────────────────────────────┐   │
│  ◉ Dash │  │                                                  │   │
│         │  │                                                  │   │
│  ⚡Svrs  │  │           Main Page Content Here                │   │
│  • List │  │                                                  │   │
│  • Add  │  │                                                  │   │
│         │  │                                                  │   │
│  👤 Ply │  │                                                  │   │
│  • List │  └──────────────────────────────────────────────────┘   │
│  • Find │                                                            │
│         │                                                            │
│  🌐 Net │                                                            │
│  💬 Msg │                                                            │
│  💰 Eco │                                                            │
│  🔒 Prm │                                                            │
│  📊 Mon │                                                            │
│  🔌 API │                                                            │
│         │                                                            │
│  ─────  │                                                            │
│  ⚙ Set  │                                                            │
│  📋 Log │                                                            │
│  ❓Help  │                                                            │
│         │                                                            │
└─────────┴────────────────────────────────────────────────────────────┘
```

## Top Navigation Bar

### Layout
```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🎮 BungeeHub    Home > Dashboard       [🔍 Search]  [🔔3] [Admin▼] [🌙] │
└──────────────────────────────────────────────────────────────────────────┘
```

### Components

1. **Logo & Brand** (Left)
   - BungeeHub logo/icon
   - Application name
   - Clickable to return to dashboard

2. **Breadcrumbs** (Left-Center)
   - Shows current navigation path
   - Each level is clickable
   - Example: "Home > Servers > Hub Server > Configuration"

3. **Global Search** (Center-Right)
   - Quick search for servers, players, commands
   - Keyboard shortcut: Ctrl+K or Cmd+K
   - Shows recent searches
   - Supports search filters (type:server, type:player)

4. **Notifications** (Right)
   - Bell icon with badge count
   - Dropdown shows recent alerts
   - Categories: Server Events, Player Actions, System Alerts
   - Mark as read functionality
   - "View All" link to notifications page

5. **User Menu** (Right)
   - User avatar and name
   - Dropdown with options:
     - My Profile
     - Account Settings
     - Preferences
     - Logout

6. **Theme Toggle** (Far Right)
   - Sun/Moon icon
   - Switches between light/dark mode
   - Persists user preference

7. **Quick Actions** (Optional - Far Right)
   - "+" icon for quick add actions
   - Dropdown: Add Server, Add Player, Send Broadcast, etc.

## Sidebar Navigation

### Primary Menu Structure

```
┌──────────────────────┐
│                      │
│  MAIN NAVIGATION     │
│                      │
│  🏠 Dashboard        │
│                      │
│  ⚡ Servers           │
│    • Server List     │
│    • Add Server      │
│    • Templates       │
│                      │
│  👤 Players          │
│    • Player List     │
│    • Find Player     │
│    • Punishments     │
│    • Statistics      │
│                      │
│  🌐 Network          │
│    • Configuration   │
│    • MOTD Editor     │
│    • Whitelist       │
│    • Maintenance     │
│                      │
│  💬 Messaging        │
│    • Announcements   │
│    • Broadcasts      │
│    • Chat History    │
│    • Templates       │
│                      │
│  💰 Economy          │
│    • Balances        │
│    • Transactions    │
│    • Shop            │
│    • Reports         │
│                      │
│  🔒 Permissions      │
│    • Roles           │
│    • Groups          │
│    • Users           │
│                      │
│  📊 Monitoring       │
│    • Overview        │
│    • Performance     │
│    • Logs            │
│    • Alerts          │
│                      │
│  🔌 API              │
│    • Documentation   │
│    • API Keys        │
│    • Webhooks        │
│    • Integrations    │
│                      │
│  ──────────────────  │
│                      │
│  ⚙️  Settings        │
│  📋 Audit Logs       │
│  ❓ Help & Support   │
│  📚 Documentation    │
│                      │
│  ──────────────────  │
│                      │
│  Network Status      │
│  🟢 Online           │
│  👥 247 Players      │
│  ⚡ 12 Servers       │
│                      │
└──────────────────────┘
```

### Sidebar Behavior

1. **Collapsible**
   - Hamburger menu to collapse/expand
   - Collapsed shows icons only
   - Expanded shows icons + labels
   - Hover on collapsed shows tooltips
   - User preference persisted

2. **Active States**
   - Current page highlighted
   - Parent menu expanded when child is active
   - Visual indicator (colored border or background)

3. **Grouping**
   - Related items grouped together
   - Expandable/collapsible groups
   - Separator lines between major sections

4. **Network Status Widget** (Bottom)
   - Live network status indicator
   - Current player count
   - Active server count
   - Clickable for quick overview

## Responsive Behavior

### Desktop (> 1200px)
- Full sidebar visible
- Top bar with all elements
- Multi-column content layouts

### Tablet (768px - 1200px)
- Collapsible sidebar (collapsed by default)
- Top bar with condensed elements
- Two-column content layouts

### Mobile (< 768px)
- Hidden sidebar (hamburger menu)
- Minimal top bar
- Single-column content
- Bottom navigation bar (optional)
- Touch-optimized controls

## Page Layout Templates

### Template 1: List View
```
┌────────────────────────────────────────────────────────────┐
│ Page Title                           [Filter] [+ Add New]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ [Search...]  [🗂 Sort] [📋 Filters]  [⚙ Actions]         │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Table Header 1  │ Header 2  │ Header 3  │ Actions  │   │
│ ├─────────────────┼───────────┼───────────┼──────────┤   │
│ │ Row 1 Data      │ Data      │ Data      │ [•••]    │   │
│ │ Row 2 Data      │ Data      │ Data      │ [•••]    │   │
│ │ Row 3 Data      │ Data      │ Data      │ [•••]    │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ Showing 1-20 of 156        [< Prev] [1][2][3]...[8] [Next>]│
└────────────────────────────────────────────────────────────┘
```

### Template 2: Detail View
```
┌────────────────────────────────────────────────────────────┐
│ ← Back to List            Server Name          [Edit] [⋮] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ [Tab 1] [Tab 2] [Tab 3] [Tab 4]                          │
│ ━━━━━━                                                     │
│                                                            │
│ ┌──────────────────────────┐  ┌──────────────────────┐   │
│ │  Information Card        │  │  Status Card         │   │
│ │                          │  │                      │   │
│ │  Field: Value            │  │  Online: Yes         │   │
│ │  Field: Value            │  │  Players: 45         │   │
│ │  Field: Value            │  │                      │   │
│ └──────────────────────────┘  └──────────────────────┘   │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │  Large Content Area (Logs, Graphs, etc.)           │   │
│ │                                                    │   │
│ │                                                    │   │
│ └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Template 3: Dashboard/Grid View
```
┌────────────────────────────────────────────────────────────┐
│ Dashboard                              Last updated: 12:34 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ │
│ │  Metric 1 │ │  Metric 2 │ │  Metric 3 │ │  Metric 4 │ │
│ │   1,234   │ │    567    │ │    89%    │ │    12     │ │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘ │
│                                                            │
│ ┌─────────────────────────┐  ┌─────────────────────────┐ │
│ │ Chart/Graph Area        │  │ Activity Feed           │ │
│ │                         │  │                         │ │
│ │     ╱╲  ╱╲             │  │ • Event 1               │ │
│ │    ╱  ╲╱  ╲╱           │  │ • Event 2               │ │
│ │   ╱                    │  │ • Event 3               │ │
│ └─────────────────────────┘  └─────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │  Wide Content Area                                 │   │
│ └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Template 4: Form View
```
┌────────────────────────────────────────────────────────────┐
│ ← Cancel                   Edit Server              [Save] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ SECTION: Basic Information                         │   │
│ │                                                    │   │
│ │ Server Name *                                      │   │
│ │ [_________________________]                        │   │
│ │                                                    │   │
│ │ Description                                        │   │
│ │ [_________________________]                        │   │
│ │ [_________________________]                        │   │
│ │                                                    │   │
│ │ Server Type *                                      │   │
│ │ [Dropdown ▼]                                       │   │
│ │                                                    │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ SECTION: Connection Settings                       │   │
│ │ ...                                                │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│                              [Cancel]  [Save Changes]     │
└────────────────────────────────────────────────────────────┘
```

## Common UI Components

### 1. Action Buttons
- Primary: Solid color (Add, Save, Confirm)
- Secondary: Outline (Cancel, Back)
- Danger: Red (Delete, Ban, Kick)
- Icon Buttons: For compact actions

### 2. Data Tables
- Sortable columns (click header)
- Filterable (column-specific filters)
- Selectable rows (checkboxes)
- Pagination (client or server-side)
- Row actions menu (•••)
- Bulk actions (when rows selected)
- Empty state with helpful message

### 3. Cards
- Border or shadow
- Header with title and optional actions
- Body with content
- Optional footer
- Collapsible option

### 4. Modals/Dialogs
- Centered overlay
- Close button (X)
- Header, Body, Footer sections
- Confirmation dialogs for destructive actions
- Form dialogs for quick actions

### 5. Toast Notifications
- Position: Top-right
- Types: Success, Error, Warning, Info
- Auto-dismiss (except errors)
- Action buttons (Undo, View Details)
- Stack multiple notifications

### 6. Loading States
- Skeleton screens for initial load
- Spinners for actions
- Progress bars for operations
- Shimmer effect for content loading

### 7. Empty States
- Icon or illustration
- Helpful message
- Primary action button
- Secondary actions or links

### 8. Filters Panel
- Slide-out from right
- Multiple filter types
  - Text search
  - Dropdowns
  - Checkboxes
  - Date ranges
  - Number ranges
- Apply/Clear buttons
- Active filters shown as chips

## Navigation Flows

### Primary Flows

1. **Quick Server Check**
   - Dashboard → Servers → Select Server → View Status
   - Duration: 2 clicks

2. **Player Lookup**
   - Global Search (Ctrl+K) → Type player name → Select → Player Profile
   - Duration: 1 search + 1 click

3. **Send Broadcast**
   - Quick Actions (+) → Send Broadcast → Fill Form → Send
   - Duration: 3 clicks + form

4. **View Logs**
   - Monitoring → Logs → Filter/Search
   - Duration: 2 clicks

5. **Manage Permissions**
   - Players → Find Player → Permissions Tab → Edit
   - Duration: 4 clicks

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open global search |
| `Ctrl/Cmd + B` | Toggle sidebar |
| `Ctrl/Cmd + /` | Show shortcuts help |
| `Esc` | Close modal/dialog |
| `Ctrl/Cmd + S` | Save (when in form) |
| `G then D` | Go to Dashboard |
| `G then S` | Go to Servers |
| `G then P` | Go to Players |
| `?` | Show help overlay |

## Accessibility Features

1. **Keyboard Navigation**
   - All interactive elements accessible via Tab
   - Skip to main content link
   - Focus indicators visible

2. **Screen Reader Support**
   - ARIA labels on all interactive elements
   - Role attributes properly set
   - Live regions for dynamic content

3. **Visual**
   - Sufficient color contrast (WCAG AA)
   - Text resizable up to 200%
   - Icons have text alternatives

4. **Motion**
   - Respect prefers-reduced-motion
   - Optional animation toggle

## Theme Support

### Light Theme
- Background: #FFFFFF, #F5F5F5
- Text: #212121, #666666
- Primary: #1976D2
- Accent: #00BCD4
- Success: #4CAF50
- Warning: #FF9800
- Error: #F44336

### Dark Theme
- Background: #121212, #1E1E1E
- Text: #FFFFFF, #B0B0B0
- Primary: #90CAF9
- Accent: #80DEEA
- Success: #81C784
- Warning: #FFB74D
- Error: #E57373

## Implementation Notes

1. Use React Router for navigation
2. Implement breadcrumbs automatically from routes
3. Sidebar state persisted in localStorage
4. Global search uses fuzzy search algorithm
5. All icons from Material Icons or Font Awesome
6. Notifications use WebSocket for real-time updates
7. Responsive breakpoints: 600px, 960px, 1280px, 1920px

---

**Next Document:** [02-DASHBOARD.md](./02-DASHBOARD.md)
