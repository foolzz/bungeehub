# BungeeHub HTML Mockups

**Interactive web prototypes for the BungeeHub management platform**

## 🎨 Overview

These HTML mockups provide a visual and interactive preview of the BungeeHub web interface. They're fully styled with custom CSS, include mock data, and feature basic JavaScript interactions.

## 📁 Files

### Main Pages
- **`index.html`** - Dashboard with live stats, server grid, and activity charts
- **`servers.html`** - Server list with detailed table view and filters
- **`players.html`** - Player management with profiles and statistics
- **`network.html`** - Network configuration (MOTD, whitelist, settings)

### Assets
- **`assets/css/styles.css`** - Complete design system with brand colors
- **`assets/js/main.js`** - Interactive functionality and mock data

## 🚀 How to Use

### Option 1: Open Directly
1. Navigate to `requirements/mockups/`
2. Open any HTML file in your web browser
3. Click around to explore the interface

### Option 2: Local Server (Recommended)
```bash
cd requirements/mockups
python3 -m http.server 8000
```
Then visit: `http://localhost:8000`

### Option 3: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 🎨 Design System

### Brand Colors
- **Primary**: `#6366f1` (Indigo) - Main brand color
- **Secondary**: `#0ea5e9` (Sky Blue) - Accent color
- **Accent**: `#f59e0b` (Amber) - Highlights

### Status Colors
- **Success**: `#10b981` (Green) - Online, healthy
- **Warning**: `#f59e0b` (Amber) - Warnings, low TPS
- **Error**: `#ef4444` (Red) - Offline, errors
- **Info**: `#3b82f6` (Blue) - Maintenance, info

### Theme Support
- Light theme (default)
- Dark theme (click moon icon 🌙 in top bar)
- Theme preference saved in localStorage

## ✨ Interactive Features

### Working Features
✅ **Theme Toggle** - Switch between light/dark modes
✅ **Live Stats** - Player count updates every 3 seconds
✅ **Server Cards** - Click to view details (shows alert)
✅ **Chart Animation** - Animated bar charts on load
✅ **Notifications** - Toast notifications for actions
✅ **Table Sorting** - Click column headers to sort
✅ **Search** - Type in search boxes (logs to console)
✅ **Filters** - Apply/clear filters with notifications
✅ **Navigation** - Clickable navigation between pages
✅ **Active States** - Current page highlighted in sidebar

### Mock Actions
- Restart server
- Kick/ban players
- Send messages
- Export data
- Enable maintenance mode
- Save configuration

## 📱 Responsive Design

The mockups are fully responsive:
- **Desktop** (> 1200px): Full sidebar, multi-column layouts
- **Tablet** (768-1200px): Collapsible sidebar, 2-column layouts
- **Mobile** (< 768px): Hidden sidebar (hamburger menu), single-column

Test responsiveness by resizing your browser window.

## 🎯 Key Pages Breakdown

### Dashboard (`index.html`)
- **Features**:
  - 4 key metric cards with live stats
  - 6 server cards in grid layout
  - Animated activity chart (24-hour data)
  - Recent events feed
  - Real-time player count updates

### Servers (`servers.html`)
- **Features**:
  - Full server table with sortable columns
  - Status badges (online/offline/warning)
  - Resource usage bars
  - Filter by status and type
  - Quick actions (view, restart, more)
  - Summary statistics cards

### Players (`players.html`)
- **Features**:
  - Player table with avatars
  - Status indicators (online/banned/muted)
  - Rank badges (VIP, MVP, MVP+)
  - Balance and playtime tracking
  - Top players leaderboards
  - Moderation actions

### Network (`network.html`)
- **Features**:
  - MOTD preview with color codes
  - Whitelist management
  - Maintenance mode toggle
  - Global settings configuration
  - Connection throttle (DDoS protection)
  - Save/cancel buttons

## 🛠️ Customization

### Colors
Edit `assets/css/styles.css` and modify the CSS variables:
```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #0ea5e9;
  /* ... */
}
```

### Mock Data
Edit `assets/js/main.js` to change:
- Server names and stats
- Player information
- Chart data
- Notification messages

### Layout
Modify grid layouts in CSS:
```css
.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

## 📊 Mock Data

All data in the mockups is fake/simulated:
- **Servers**: 7 servers (5 online, 1 offline, 1 maintenance)
- **Players**: 247 online, 12,458 total, 143 banned
- **Network**: 500 max players, Hub-1 as default server
- **Activity**: Random generated chart data

## 🎓 For Developers

### CSS Architecture
- **Design tokens** (CSS variables for consistency)
- **Utility classes** (margin, flex, text alignment)
- **Component-based** (cards, buttons, badges)
- **Mobile-first** responsive design

### JavaScript Features
- **Theme persistence** (localStorage)
- **Mock data generators** for testing
- **Event handlers** for all interactive elements
- **Notification system** for user feedback
- **Table sorting** algorithm

### Adding New Pages
1. Copy an existing HTML file
2. Update the `<title>` and breadcrumbs
3. Change active nav link in sidebar
4. Add your content
5. Link from other pages

## ⚠️ Limitations

These are **static mockups** and do NOT include:
- ❌ Real backend API connections
- ❌ Database integration
- ❌ User authentication
- ❌ Real-time WebSocket updates
- ❌ Form validation
- ❌ Data persistence

They are meant for:
- ✅ Design review and approval
- ✅ UX flow testing
- ✅ Stakeholder presentations
- ✅ Developer reference
- ✅ User testing sessions

## 🔍 Testing Checklist

When reviewing these mockups, check:
- [ ] All pages load without errors
- [ ] Navigation works between pages
- [ ] Dark theme toggle works
- [ ] Buttons show appropriate notifications
- [ ] Layout is responsive on different screen sizes
- [ ] Colors and branding are correct
- [ ] Typography is readable
- [ ] Icons and emojis display correctly
- [ ] Interactive elements have hover states
- [ ] Forms look complete and usable

## 📝 Providing Feedback

When reviewing, please note:
1. **Page**: Which HTML file
2. **Section**: Specific area or component
3. **Issue**: What needs to change
4. **Suggestion**: How to improve it

Example:
```
Page: index.html
Section: Server grid cards
Issue: Server names are too small
Suggestion: Increase font size from 18px to 20px
```

## 🚀 Next Steps

After mockup approval:
1. ✅ Design approved
2. → Implement React components
3. → Build backend API
4. → Connect real data
5. → Add authentication
6. → Deploy to production

## 📞 Support

Questions about the mockups?
- Check the main requirements documentation
- Review the inline CSS comments
- Look at JavaScript console logs for debug info

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Status**: Ready for Review

Enjoy exploring the BungeeHub interface! 🎮
