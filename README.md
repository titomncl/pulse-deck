# Pulse Deck

> _A self-hosted dynamic overlay builder for Twitch — real-time sync, full customization, zero cloud dependencies._

**v0.2.0** - More polish, improved UX, and per-element animations. Build beautiful overlays faster with finer control over visuals and behavior.

[![Status](https://img.shields.io/badge/status-alpha-orange)]()
[![Version](https://img.shields.io/badge/version-0.2.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-orange)]()
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)]()
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)]()
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)]()

![Pulse Deck](https://via.placeholder.com/800x200/9146ff/ffffff?text=Pulse+Deck+v0.2)
_⚠️ Visual coming soon - this is a placeholder_

## ✨ Highlights in v0.2.0

- per-element animations: choose how each element enters and exits (fade, slides, scale, or none)
- emote & thumbnail improvements: centered square cropping with rounded corners and a live size slider for fine control
- marquee for long text: long titles and subtitles scroll smoothly while keeping panel layout stable
- improved preview experience: stable preview sizing so animations and overflow behave predictably
- youtube & latest vod improvements: more robust fetching with optional API key and selectable recent videos

these changes focus on polish and usability: better visuals, predictable preview behavior, and improved control over individual elements.

---

## 🚀 Quick Start

### For Streamers (No Coding Required!)

1. **Download Pulse Deck**

   - Go to [Releases](https://github.com/titomncl/pulse-deck/releases)
   - Download `pulse-deck-v0.1.0.zip`
   - Extract the ZIP file to your desired location

2. **Install Node.js** (if you don't have it)

   - Download from [nodejs.org](https://nodejs.org/) (choose LTS version 18+)
   - Run the installer and follow the prompts
   - Restart your computer after installation (if asked)

3. **Start Pulse Deck**

   - **Windows:** Run `START_OVERLAY.bat`
   - **macOS/Linux:** Run `start_overlay.sh`
   - Wait for automatic setup (first time only)

4. **Configure Your Overlay**

   - In the browser of your choice, go to `http://localhost:3000/customize`
   - Click "Connect with Twitch" to authorize
   - Add elements, customize colors, save your setup

5. **Add to OBS**
   - Click "🔗 Generate OBS URL" button
   - Copy the generated URL
   - In OBS: Add **Browser Source**
   - Paste URL, set size to **1920x1080**
   - ✅ Done!

---

### For Developers

```bash
# Clone repository
git clone https://github.com/titomncl/pulse-deck
cd pulse-deck

# Install dependencies
npm install

# Build application (required!)
npm run build

# Start development server
npm run dev

# Or start production server
npm start
```

## ⚙️ Environment (.env)

Pulse Deck reads runtime configuration from a `.env` file located at the project root. For safety, do **not** commit real secrets — copy the example file and edit it locally:

1. Copy the example file:

```bash
cp .env.example .env
```

2. Edit `.env` and restart the server.

Key variables (placeholders are shown in `.env.example`):

- `PULSE_DECK_SECRET` — a random secret used to derive the encryption key for stored credentials. Use a long, random value (recommended 32+ bytes).
- `ALLOW_REMOTE_CONFIG_WRITES` — `false` by default; set to `true` only if you intentionally allow remote write operations and understand the risk.
- `CONFIG_API_KEY` — optional API key used to authorize certain write operations and trusted callers.
- `OVERLAY_TOKEN_TTL_HOURS` — how long generated OBS tokens remain valid (default `168` = 7 days).
- `PORT` — the HTTP server port (default `3000`).
- `WS_PORT` — the WebSocket server port (default `3001`).
- `VITE_TWITCH_CLIENT_ID` — Twitch Client ID for the frontend (prefixed with `VITE_` for Vite).
- `VITE_TWITCH_REDIRECT_URI` — OAuth redirect URI used by the Twitch app (e.g. `http://localhost:3000/auth/callback`).

After editing `.env`, restart the server to apply changes. Keep the `.env` file local and never commit client secrets or API keys to source control.

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
- **Import/Export** - Share configs with other streamers _(coming in v0.2)_
- **Version Control** - Track changes and rollback if needed _(coming in v0.3)_

### 🔗 Data Sources

**Connect your stream data:** Choose where each element gets its information.

- **Twitch API** - Live follower/subscriber counts (requires API setup)
- **Config-based** - Static data like chat commands, social links
- **Manual** - Set custom values that you control
- **Custom** - Advanced: Integrate external APIs _(examples coming in v0.2)_

### 🎬 OBS Integration

**Seamless live updates:** Changes sync to OBS instantly—no refresh needed.

- **WebSocket sync** - Real-time updates without lag
- **UUID-based URLs** - Masks Twitch tokens and links to your specific overlay config
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
   - Name: "Pulse Deck" (or your choice)
   - OAuth Redirect URL: `http://localhost:3000/auth/callback`
   - Category: "Application Integration"
   - Save your **Client ID** and **Client Secret**

2. **Connect Your Twitch Account**

   - Open `http://localhost:3000/customize` in your browser (NOT in OBS)
   - Click "**Connect with Twitch**" button
   - Authorize Pulse Deck to access your data
   - Your credentials are stored securely in browser localStorage

3. **Generate OBS Browser URL**

   - Click "**🔗 Generate OBS URL**" button
   - A unique URL with UUID is created
   - Server links your Twitch data to this UUID
   - Copy the URL

4. **Enable Live Data in Elements**
   - Add or edit an element
   - Set Data Source to "**Twitch Followers**" or "**Twitch Subscribers**"
   - Live counts will update automatically!

**Supported Twitch Data:**

- Follower count (real-time)
- Subscriber count (real-time)
- Latest VOD information
- Stream status _(coming in v0.2)_

**Note:** The UUID in your OBS URL is for uniqueness, not security. Anyone with the URL can view your overlay, but URLs are hard to guess.

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
- JavaScript support _(coming in v0.4)_

**Best for:** Special effects, animated graphics, integration with external APIs, unique brand designs

**Example Use:**

```html
HTML:
<div class="rainbow-text">🌈 PRIDE MONTH SPECIAL 🌈</div>

CSS: .rainbow-text { animation: rainbow 3s infinite; font-size: 28px; } @keyframes rainbow { /* gradient animation */ }
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
        "value": 1234.5,
        "prefix": "$",
        "suffix": ""
      }
    }
  ]
}
```

### Data Sources Reference

| Source                | Description                | Requirements           |
| --------------------- | -------------------------- | ---------------------- |
| `none`                | Manual values only         | None                   |
| `twitch.followers`    | Live follower count        | Twitch API credentials |
| `twitch.subscribers`  | Live subscriber count      | Twitch API credentials |
| `twitch.vods`         | Latest VOD info            | Twitch API credentials |
| `config.chatCommands` | Command list from config   | None                   |
| `custom.donations`    | External donation tracking | API integration        |

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

## -## 📊 Project Stats

- **Version**: 0.2.0 (Alpha)
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

_Made with 💜 by streamers, for streamers_
