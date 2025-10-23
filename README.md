# Pulse Deck

> *A self-hosted dynamic overlay builder for Twitch — real-time sync, full customization, zero cloud dependencies.*

**v0.1.0** - A beautiful, fully customizable streaming overlay that runs locally on your machine. No hard-coded limitations—create the perfect overlay for your stream!

[![Status](https://img.shields.io/badge/status-alpha-orange)]()
[![Version](https://img.shields.io/badge/version-0.1.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-orange)]()
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)]()
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)]()
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)]()

![Pulse Deck](https://via.placeholder.com/800x200/9146ff/ffffff?text=Pulse+Deck+v0.1)
*⚠️ Visual coming soon - this is a placeholder*

## ✨ What's New in v0.1.0

- 🎉 **Dynamic Elements** - Add unlimited custom elements through the UI
- 🎨 **5 Element Types** - Progress, Counter, List, Info, Custom HTML
- 💾 **User Defaults** - Save & restore your perfect setup
- 🔄 **Real-time Sync** - Changes apply instantly to OBS via WebSocket
- 📱 **Beautiful UI** - Modern, intuitive interface

---

## 🚀 Quick Start (5 Minutes)

### 1. Install
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

### 3. Configure Your Overlay
Open `http://localhost:3000/customize` in your browser

### 4. Add to OBS
1. Click "🔗 Generate OBS URL" in the customize page
2. Add **Browser Source** in OBS
3. Paste the generated URL
4. Set dimensions: **1920x1080**
5. ✅ Done! Your overlay is live

---

## 🔒 Security & Privacy

**Your data stays local.** Pulse Deck:
- ✅ Stores all credentials locally on your machine
- ✅ Never transmits tokens to third-party servers
- ✅ Uses UUID-based authentication for OBS links
- ✅ Runs entirely on your computer—no cloud dependencies

Your Twitch API credentials and overlay configs are stored in local JSON files that only you can access.

---

## 🌍 Platform Compatibility

**Tested and stable on:**
- ✅ Windows 10/11 (64-bit)
- ✅ macOS Monterey, Ventura, Sonoma (Intel & Apple Silicon)
- ✅ Linux (Ubuntu 20.04+, Debian 11+)

**Requirements:**
- Node.js 18+ (LTS recommended)
- 500MB free disk space
- Modern web browser (Chrome, Firefox, Edge, Safari)

---

## 🎯 Features

### 🎨 Dynamic Elements System
**Dynamic freedom:** Add unlimited elements with full customization—no code required.

**Five ready-made types:**
- 📊 **Progress** - Goal tracking with visual progress bars (followers, subs, donations)
- 🔢 **Counter** - Numbers with customizable prefix/suffix (viewers, points, currency)
- 📋 **List** - Multiple items shown as carousel or grid (commands, socials, schedules)
- ℹ️ **Info** - Text and image panels (announcements, latest VOD, info cards)
- ⚙️ **Custom** - Advanced users can inject HTML/CSS for unique designs
  
### 💾 Configuration Management
**Never lose your setup:** Save your perfect overlay layout and restore it anytime.

- **Save as Default** - Create your personal default configuration
- **Reset Options** - Restore to your saved default or factory settings
- **Import/Export** - Share configs with other streamers *(coming in v0.2)*
- **Version Control** - Track changes and rollback if needed *(coming in v0.3)*

### 🔗 Data Sources
**Connect your stream data:** Choose where each element gets its information.

- **Twitch API** - Live follower/subscriber counts (requires API setup)
- **Config-based** - Static data like chat commands, social links
- **Manual** - Set custom values that you control
- **Custom** - Integrate donations (Streamlabs, StreamElements), alerts, or anything!

### 🎬 OBS Integration
**Seamless live updates:** Changes sync to OBS instantly—no refresh needed.

- **WebSocket sync** - Real-time updates without lag
- **Secure authentication** - UUID-based tokens prevent unauthorized access
- **No refresh needed** - Edit elements while streaming
- **Multiple instances** - Use different overlay configs per OBS scene

### 🎨 Full Customization
**Make it yours:** Complete visual control over every element.

- **Color themes** - Match your brand colors
- **Transitions** - Choose from 5 smooth animation styles
- **Emotes/Icons** - Use emoji, Twitch emotes, or custom images
- **Display order** - Control rotation sequence and z-index
- **Position & Size** - Pixel-perfect placement

---

## 🔌 Twitch API Integration

### Setup Instructions

1. **Create Twitch Developer Application**
   - Go to https://dev.twitch.tv/console/apps
   - Click "Register Your Application"
   - Set OAuth Redirect URL to `http://localhost:3000/auth/callback`
   - Save your **Client ID** and **Client Secret**

2. **Configure in Pulse Deck**
   - Open `/customize` page
   - Click "🔗 Generate OBS URL"
   - Enter your Twitch Client ID and API Key
   - Click "Generate" - your credentials are stored locally

3. **Enable Live Data**
   - Edit any element
   - Set Data Source to "Twitch Followers" or "Twitch Subscribers"
   - Your live counts will update automatically!

**Supported Twitch Data:**
- Follower count (real-time)
- Subscriber count (real-time)
- Latest VOD information
- Stream status *(coming in v0.2)*

---

## 📖 Documentation

### For Users
- **Quick Setup** - See [Quick Start](#-quick-start-5-minutes) above
- **Adding Elements** - Click "+ Add New Element" in customize page
- **Editing Elements** - Click any element in the list to modify
- **Saving Setup** - Click "💾 Save as My Default" to remember your layout
- **OBS Setup** - Generate secure URL and add as Browser Source

### For Developers
- **Architecture** - React 18 frontend + Express backend + WebSocket real-time sync
- **Config Format** - JSON-based array of element objects
- **API Endpoints** - RESTful config management with `/api/config/*` routes
- **Element Rendering** - Dynamic component system in `src/utils/elementRenderer.jsx`
- **WebSocket Protocol** - Simple JSON messages for config updates

---

## 🎮 Use Cases & Examples

### Stream Goals
Create a follower goal tracker that updates live:
```json
{
  "type": "progress",
  "title": "Follower Goal",
  "dataSource": "twitch.followers",
  "fields": {
    "goal": 1000,
    "showPercentage": true
  }
}
```
![Follower Goal Example](https://via.placeholder.com/400x100/9146ff/ffffff?text=Follower+Goal+Example)

### Donation Counter
Track total donations with custom currency:
```json
{
  "type": "counter",
  "title": "Total Donations",
  "fields": {
    "prefix": "$",
    "value": 0
  }
}
```

### Chat Commands
Display available commands as a rotating carousel:
```json
{
  "type": "list",
  "title": "Commands",
  "dataSource": "config.chatCommands",
  "fields": {
    "showAsCarousel": true,
    "maxItems": 1
  }
}
```

### Social Links
Show all your social media:
```json
{
  "type": "list",
  "title": "Follow Me",
  "fields": {
    "items": ["!twitter", "!youtube", "!discord"],
    "showAsCarousel": false
  }
}
```

### Custom Announcements
Advanced HTML for special events:
```json
{
  "type": "custom",
  "fields": {
    "html": "<div class='birthday'>🎉 Birthday Stream Tomorrow at 6PM!</div>",
    "css": ".birthday { font-size: 24px; color: gold; }"
  }
}
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite 5
- **Backend**: Express 4 + Node.js 18+
- **Real-time**: WebSocket (ws library)
- **APIs**: Twitch Helix API v5
- **Storage**: JSON files + localStorage
- **Build**: Vite for fast HMR and optimized builds

---

## 📦 Installation Methods

### Current Method (Developers & Power Users)
```bash
git clone https://github.com/titomncl/pulse-deck
cd pulse-deck
npm install
npm start
```

### Coming Soon: Easy Installation

#### 🪟 Windows Installer (.exe) - v0.5
**One-click installation for streamers**
- Auto-install with setup wizard
- Auto-start with Windows option
- System tray application
- Start Menu shortcuts
- Clean uninstallation

#### 🍎 macOS App Bundle (.app) - v0.6
**Native macOS experience**
- DMG installer with drag-to-Applications
- Code signed for Gatekeeper
- Menu bar application
- Auto-updater built-in

#### 📦 Portable Version - v0.5
**No installation needed**
- Single folder with everything included
- Run from USB stick or external drive
- Perfect for testing before installing
- Windows & macOS versions

---

## 🗺️ Roadmap

### Short Term (v0.2-0.3 - December 2025)

**Goal: Make it easier for non-technical users**

- [ ] **Drag & drop reordering** → Rearrange elements visually instead of using z-index numbers
- [ ] **Duplicate element button** → Copy overlay blocks instantly to speed up layout creation
- [ ] **Element templates library** → Pre-made designs for common use cases (sub goals, donation trackers)
- [ ] **Unsaved changes warning** → Prevent accidental data loss when navigating away
- [ ] **Import/export configurations** → Share your overlay designs with other streamers

### Medium Term (v0.5-0.7 - March 2026)

**Goal: Easy installation and expanded integrations**

- [ ] **Windows portable executable** → Run the app without Node.js installation
- [ ] **macOS native application** → Professional Mac app with installer
- [ ] **Conditional display rules** → Show elements only when viewer count > 100, or during specific hours
- [ ] **YouTube & Discord integrations** → Connect data from multiple platforms
- [ ] **Community template library** → Browse and download overlays created by others

### Long Term (v1.0+ - June 2026)

**Goal: Professional-grade features and v1.0 release**

- [ ] **Plugin system** → Allow developers to create custom element types
- [ ] **Mobile companion app** → Control your overlay from phone/tablet
- [ ] **A/B testing** → Test two overlay versions and see which performs better
- [ ] **Analytics dashboard** → Track viewer engagement with each element
- [ ] **Multi-language support** → Internationalization for global streamers

See [todo.md](./todo.md) for the complete roadmap with technical details.

---

## 🎨 Element Types Reference

### 📊 Progress Bar
**Perfect for tracking goals** - Visual progress indicator with percentage display

**Fields:**
- Current value (manual entry or live from Twitch API)
- Goal target (numeric)
- Show percentage (yes/no toggle)
- Color customization

**Best for:** Follower goals, subscriber milestones, donation goals, event countdowns

**Example Use:**
```
Current: 847 followers
Goal: 1000 followers
Display: "847 / 1000 (85%)" with animated progress bar
```

---

### 🔢 Counter
**Display any number** - Simple numeric display with optional formatting

**Fields:**
- Value (manual or automated)
- Prefix (e.g., $, €, #)
- Suffix (e.g., pts, viewers, hours)
- Increment/decrement buttons

**Best for:** Donation totals, viewer count, death counters, custom metrics

**Example Use:**
```
Prefix: "$"
Value: 1,234.50
Suffix: ""
Display: "$1,234.50"
```

---

### 📋 List
**Show multiple items** - Flexible list display with carousel mode

**Fields:**
- Items array (manual list)
- Max items to show simultaneously
- Carousel mode (rotate one at a time)
- Rotation speed (seconds per item)

**Best for:** Chat commands (!discord, !socials), stream schedules, social links, sponsor shoutouts

**Example Use:**
```
Items: ["!discord - Join our community", "!twitter - @yourhandle", "!youtube - YourChannel"]
Mode: Carousel
Speed: 5 seconds per item
```

---

### ℹ️ Info
**Simple text/image display** - Information panel with optional thumbnail

**Fields:**
- Main text (headline)
- Subtext (description)
- Show thumbnail (yes/no)
- Thumbnail URL or upload
- Link URL (optional)

**Best for:** Latest VOD, announcements, sponsor cards, upcoming streams

**Example Use:**
```
Main: "Last Stream: Elden Ring Finale"
Subtext: "Watch the VOD on YouTube!"
Thumbnail: [video thumbnail]
Link: https://youtube.com/watch?v=...
```

---

### ⚙️ Custom
**For advanced users** - Full HTML/CSS control for unique designs

**Fields:**
- HTML content (raw HTML)
- Custom CSS (scoped styles)
- JavaScript support *(coming in v0.4)*

**Best for:** Special effects, animated graphics, integration with external APIs, unique brand designs

**Example Use:**
```html
HTML:
<div class="rainbow-text">
  🌈 PRIDE MONTH SPECIAL 🌈
</div>

CSS:
.rainbow-text {
  animation: rainbow 3s infinite;
  font-size: 28px;
}
@keyframes rainbow { /* gradient animation */ }
```

---

## 🔧 Configuration

### Config File Structure
```json
{
  "rotationDuration": 5000,
  "transitionAnimation": "fadeSlide",
  "colors": {
    "background": "#1e1e2e",
    "primary": "#9146ff",
    "secondary": "#ffffff",
    "accent": "#00ff7f"
  },
  "elements": [
    {
      "id": "followerGoal",
      "type": "progress",
      "enabled": true,
      "title": "Follower Goal",
      "subtitle": "Road to 1K",
      "emote": "👥",
      "dataSource": "twitch.followers",
      "zIndex": 1,
      "fields": {
        "goal": 1000,
        "current": 847,
        "showPercentage": true
      }
    },
    {
      "id": "donations",
      "type": "counter",
      "enabled": true,
      "title": "Total Donations",
      "emote": "💰",
      "dataSource": "manual",
      "zIndex": 2,
      "fields": {
        "value": 1234.50,
        "prefix": "$",
        "suffix": ""
      }
    }
  ]
}
```

### Data Sources Reference

| Source | Description | Requirements |
|--------|-------------|--------------|
| `none` | Manual values only | None |
| `twitch.followers` | Live follower count | Twitch API credentials |
| `twitch.subscribers` | Live subscriber count | Twitch API credentials |
| `twitch.vods` | Latest VOD info | Twitch API credentials |
| `config.chatCommands` | Command list from config | None |
| `custom.donations` | External donation tracking | API integration |

---

## 🤝 Contributing

We welcome contributions! Here are the areas where help is most needed:

### 🔥 High Priority
1. **Windows Installer** - Most requested by users (pkg + NSIS experience needed)
2. **UI/UX Improvements** - Always valuable (React/CSS skills)
3. **Bug Fixes** - Check [Issues](https://github.com/titomncl/pulse-deck/issues) tab
4. **Documentation** - Help new users get started faster
5. **Element Templates** - Share your creative overlay designs

### Development Setup
```bash
# Clone repository
git clone https://github.com/titomncl/pulse-deck
cd pulse-deck

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

### Pull Request Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and well-described
- Reference related issues

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for full details

Copyright (c) 2025 [Your Name]

---

## 🆘 Support & Troubleshooting

### Common Issues

**❌ Elements not showing in OBS?**
- ✅ Check element is enabled (checkbox in customize page)
- ✅ Verify OBS Browser Source URL is correct
- ✅ Ensure dimensions are set to 1920x1080
- ✅ Look for errors in OBS's browser console (right-click source → Interact)

**❌ OBS not updating when I make changes?**
- ✅ Check server is running (`npm start`)
- ✅ Verify WebSocket connection (check browser console: F12)
- ✅ Try refreshing the OBS Browser Source
- ✅ Regenerate OBS URL if it's been more than 7 days

**❌ Twitch data not loading?**
- ✅ Confirm Client ID and Client Secret are entered correctly
- ✅ Check token hasn't expired (regenerate if needed)
- ✅ Verify your Twitch app has correct redirect URLs
- ✅ Check network connection and firewall settings

**❌ Server won't start?**
- ✅ Ensure Node.js 18+ is installed (`node --version`)
- ✅ Check if port 3000 is already in use
- ✅ Try deleting `node_modules` and run `npm install` again
- ✅ Look for error messages in terminal

### Get Help

- 📖 **Documentation**: Check [todo.md](./todo.md) for known issues and solutions
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/titomncl/pulse-deck/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/titomncl/pulse-deck/discussions)
- 💬 **Discord**: [TitomNCL](https://discord.gg/XqUtR4baxa) - Join our community server

---

## 🌟 Acknowledgments

**Built with love for the streaming community** ❤️

Special thanks to:
- The React team for an amazing framework
- Express.js for reliable server infrastructure
- Vite for lightning-fast development experience
- The Twitch developer community
- All our contributors and testers

**Open Source Libraries:**
- [React](https://react.dev/) - UI framework
- [Express](https://expressjs.com/) - Web server
- [Vite](https://vitejs.dev/) - Build tool
- [ws](https://github.com/websockets/ws) - WebSocket library
- [Twitch API](https://dev.twitch.tv/) - Live stream data

---

## 📊 Project Stats

- **Version**: 0.1.0 (Alpha)
- **Last Updated**: October 24, 2025
- **Lines of Code**: ~3,500
- **Elements You Can Create**: Unlimited! 🚀
- **Active Users**: Just getting started
- **GitHub Stars**: [⭐ Star us!](https://github.com/titomncl/pulse-deck)

---

## 🎯 Why Pulse Deck?

### 🏠 Local & Private
Your data never leaves your computer. No cloud dependencies, no tracking, complete privacy.

### ⚡ Real-Time Updates
Changes sync to OBS instantly via WebSocket. Edit while streaming without interruptions.

### 🎨 Unlimited Creativity
Not limited to preset elements. Create anything you can imagine with custom HTML/CSS.

### 💰 100% Free
Open source forever. No subscriptions, no hidden costs, no premium tiers.

### 🔧 Developer-Friendly
Clean codebase, well-documented, easy to extend. Built by developers, for developers.

---

**Ready to create your perfect overlay?** 

👉 **[Get Started Now](#-quick-start-5-minutes)** 🚀

---

*Made with 💜 by streamers, for streamers*
