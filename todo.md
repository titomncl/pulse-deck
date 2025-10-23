# Stream Overlay - TODO & Roadmap

## 🎯 Project Vision

A dynamic, customizable streaming overlay built for OBS that runs locally on the streamer's machine. Designed for ease of use with a beautiful UI and no hard-coded limitations.

### Target Users
- **Primary**: Windows streamers (70%)
- **Secondary**: macOS streamers (25%)
- **Tertiary**: Linux streamers (5%)

### Core Philosophy
- **Zero coding required** - Everything through UI
- **Offline-first** - Works without internet (except Twitch API)
- **Simple setup** - One-click install & run
- **Beautiful by default** - Professional look out of the box

---

## ✅ COMPLETED - v0.1.0 (Initial Release)

### Dynamic Elements System
- [x] Remove all hard-coded element types
- [x] Array-based element configuration
- [x] Add/edit/delete any element through UI
- [x] 5 element types (Progress, Counter, List, Info, Custom)
- [x] Data source system (Twitch, config, manual)
- [x] User default configurations
- [x] Factory reset functionality
- [x] Automatic migration from old config
- [x] Complete documentation

### UI Features
- [x] "+ Add New Element" button
- [x] Delete element buttons
- [x] Element type selector
- [x] Data source picker
- [x] "Save as My Default" functionality
- [x] "Reset to My Default" button
- [x] "Reset to Factory Default" button
- [x] Live preview system
- [x] Real-time WebSocket updates
- [x] Color theme customization

---

## 🚀 PHASE 1: UI/UX Polish (High Priority)

### Immediate Improvements
- [ ] **Drag & Drop Element Reordering**
  - Visual drag handles on each element
  - Auto-renumber z-index on reorder
  - Visual feedback during drag
  - Persist order immediately

- [ ] **Duplicate Element Button**
  - "📋 Duplicate" button next to delete
  - Copies all settings
  - Auto-increment name (e.g., "Follower Goal Copy")
  - Opens edit view after duplication

- [ ] **Element Preview Icons**
  - Show type icon in element list (📊, 🔢, 📋, ℹ️, ⚙️)
  - Color-code by type
  - Visual enabled/disabled state
  - Mini preview of content

- [ ] **Unsaved Changes Warning**
  - Track dirty state
  - Yellow indicator when changes pending
  - Browser "Are you sure?" on navigation
  - "Discard Changes" option

- [ ] **Collapsible Form Sections**
  - Group: Basic Settings (title, subtitle, emote)
  - Group: Data & Display (type, data source)
  - Group: Type-Specific Settings
  - Group: Advanced (z-index, custom CSS)

- [ ] **Element Templates**
  - Dropdown: "From Template" vs "Blank"
  - Pre-built templates:
    - Follower Goal
    - Subscriber Goal
    - Donation Counter
    - Social Links
    - Chat Commands
    - Stream Schedule
  - One-click template insertion

### Medium Priority
- [ ] **Search & Filter Elements**
  - Search box for element titles
  - Filter: All / Enabled / Disabled
  - Filter by type dropdown
  - Clear filters button

- [ ] **Keyboard Shortcuts**
  - `Ctrl+S` - Apply changes
  - `Ctrl+N` - New element
  - `Delete` - Delete selected
  - `Esc` - Close element editor
  - `↑↓` - Navigate list
  - Show shortcuts in help tooltip

- [ ] **Better Error Messages**
  - Field validation with helpful messages
  - Required field indicators
  - Data source compatibility warnings
  - Success/error toast notifications

- [ ] **Loading States**
  - Spinner while fetching Twitch data
  - "Saving..." indicator
  - Progress bar for long operations
  - Skeleton loaders for preview

- [ ] **Element Color Picker**
  - Assign colors to elements
  - Colored border in list
  - Visual organization

- [ ] **Import/Export Config**
  - "📥 Import Config" button
  - "📤 Export Config" button
  - JSON file download
  - Share configs with others
  - Backup before major changes

### Nice to Have
- [ ] **Change History / Version Control**
  - Track all config changes
  - "View History" modal
  - Rollback to previous version
  - Compare versions side-by-side

- [ ] **Bulk Actions**
  - Checkbox select mode
  - Enable/Disable selected
  - Delete selected
  - Change z-index for selected

- [ ] **Element Groups/Categories**
  - Tabs: Goals / Info / Commands / Custom
  - Collapse/expand groups
  - Move between groups

- [ ] **Animation Previewer**
  - Live preview of transitions
  - Test different animation speeds
  - Preview goal celebration animations

- [ ] **Rework Animation System (Separate Section Animations)**
  - Currently: Entire panel animates as one unit
  - Need: Independent animation for emote/logo section (`.panel-emote`)
  - Need: Independent animation for information section (`.panel-right-content`)
  - Need: Separate mount/unmount animations for overlay vs sections
  - Independent timing controls per section (e.g., logo bounces while info slides)
  - Animation picker per section in Customize UI
  - Examples: logo can spin/bounce, info can slide/fade, all independent
  - Smooth section-specific transitions without affecting other sections

---

## 🎨 PHASE 2: Advanced Features

### Conditional Display
- [ ] **Rule-Based Showing**
  - Show when viewer count > X
  - Show during specific hours
  - Show when stream is live
  - Show on specific days
  - Complex AND/OR conditions

### Analytics & Optimization
- [ ] **Element Statistics**
  - Times displayed
  - Average view duration
  - Last shown timestamp
  - Engagement metrics

- [ ] **A/B Testing**
  - Test two versions
  - 50/50 split
  - Track performance
  - Auto-select winner

### Customization++
- [ ] **Per-Element Animations**
  - Choose animation per element
  - Custom animation timing
  - Entrance/exit effects

- [ ] **Custom CSS Field**
  - Advanced users can add CSS
  - Per-element custom styling
  - CSS validation

- [ ] **Element Scheduling**
  - Show element at specific times
  - Rotation schedules
  - Time-based content

---

## 🔌 PHASE 3: Integrations & Data Sources

### Additional Data Sources
- [ ] **YouTube Integration**
  - Subscriber count
  - Latest video info
  - View count

- [ ] **Discord Integration**
  - Server member count
  - Online members
  - Voice channel status

- [ ] **Twitter/X Integration**
  - Follower count
  - Latest tweet

- [ ] **StreamElements/StreamLabs**
  - Donation tracking
  - Recent donations
  - Top donator

- [ ] **Spotify Integration**
  - Now playing
  - Song requests

- [ ] **Custom Webhooks**
  - Generic webhook receiver
  - POST data to update elements
  - REST API for external tools

### OBS Integration
- [ ] **OBS WebSocket Support**
  - Detect OBS connection
  - Scene-specific overlays
  - Auto-start/stop with stream

---

## 📦 PHASE 4: Distribution & Setup (CRITICAL)

### Easy Installation
- [ ] **Windows Installer (.exe)**
  - NSIS or Electron Builder
  - One-click install
  - Start menu shortcuts
  - Auto-update capability
  - System tray app

- [ ] **macOS App Bundle (.app)**
  - DMG installer
  - Code signed
  - Auto-update
  - Menu bar app

- [ ] **Portable Version**
  - No installation needed
  - USB stick friendly
  - All data in app folder

### Setup Wizard
- [ ] **First-Time Setup**
  - Welcome screen
  - Twitch API setup guide
  - OBS connection test
  - Default theme selection
  - Template gallery

- [ ] **Auto-Start Options**
  - Start with Windows/macOS
  - Start minimized
  - Start hidden in tray

### User Experience
- [ ] **System Tray Application**
  - Minimize to tray
  - Quick access menu
  - "Open Customize"
  - "Copy OBS URL"
  - "Quit"

- [ ] **Auto-Update System**
  - Check for updates on startup
  - Download in background
  - Install on restart
  - Release notes display

- [ ] **Better Documentation**
  - In-app help system
  - Interactive tutorials
  - Video guides
  - FAQ section
  - Troubleshooting wizard

---

## 🎯 PHASE 5: Community & Growth

### Sharing & Templates
- [ ] **Community Template Library**
  - Online template gallery
  - Upload your configs
  - Rate & review templates
  - Search by category
  - One-click install

- [ ] **Plugin System**
  - Custom element types
  - Third-party integrations
  - NPM-like package manager

### Social Features
- [ ] **Share Your Setup**
  - Generate share link
  - QR code for mobile
  - Social media images
  - Showcase gallery

---

## 🐛 Bug Fixes & Technical Debt

### Known Issues
- [ ] Element list doesn't show real-time preview
- [ ] No validation on empty element titles
- [ ] Missing error handling for API failures
- [ ] WebSocket reconnection not robust

### Performance
- [ ] Optimize re-renders in Customize.jsx
- [ ] Lazy load components
- [ ] Cache Twitch API responses
- [ ] Reduce bundle size

### Code Quality
- [ ] Add TypeScript
- [ ] Write unit tests
- [ ] E2E tests for critical flows
- [ ] Better error boundaries
- [ ] Code documentation

---

## 💡 Nice-to-Have Features

### Accessibility
- [ ] Screen reader support
- [ ] Keyboard navigation everywhere
- [ ] High contrast mode
- [ ] Font size adjustments

### Localization
- [ ] Multi-language support
- [ ] Translate UI
- [ ] Locale-specific formatting

### Mobile
- [ ] Mobile-responsive customize page
- [ ] Edit from phone/tablet
- [ ] Mobile app for quick edits

### Advanced
- [ ] Multi-monitor support
- [ ] Multiple overlay profiles
- [ ] Stream deck integration
- [ ] Command-line interface

---

## 📊 Success Metrics

### Usage Goals
- **Week 1**: 10 users
- **Month 1**: 100 users
- **Month 3**: 500 users
- **Month 6**: 1000 users

### Quality Metrics
- Setup time < 5 minutes
- 90% user satisfaction
- < 5% support requests
- 95% uptime
- < 100ms UI response time

---

## 🗓️ Timeline

### Q4 2025
- ✅ Dynamic elements system (v0.1.0 - DONE)
- [ ] Phase 1: UI/UX Polish (v0.2-0.3)
- [ ] Import/export configurations (v0.2)
- [ ] Element templates (v0.3)

### Q1 2026
- [ ] Windows/macOS installers (v0.5-0.6)
- [ ] Phase 2: Advanced features (v0.4-0.7)
- [ ] Community template library (v0.7)
- [ ] Conditional display rules (v0.6)

### Q2 2026
- [ ] Phase 3: Additional integrations (v0.8-0.9)
- [ ] Plugin system (v0.9)
- [ ] Polish and testing
- [ ] v1.0.0 stable release

---

## 🤝 Contributing

Want to help? Priority areas:
1. **Windows installer** - Most needed
2. **UI/UX improvements** - Always welcome
3. **Bug fixes** - Check GitHub issues
4. **Documentation** - Help new users
5. **Templates** - Share your configs

---

**Last Updated**: October 24, 2025
**Current Version**: 0.1.0 (Alpha)
**Next Release**: 0.2.0 (UI Polish & Import/Export)
