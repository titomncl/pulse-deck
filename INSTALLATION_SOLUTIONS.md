# Local Installation Solutions - Stream Overlay

## 🎯 Goal
Make Stream Overlay as easy to install as Discord or OBS. One-click install, no technical knowledge required.

---

## 📊 Platform Priority

Based on streamer demographics:

| Platform | Priority | Users | Implementation |
|----------|----------|-------|----------------|
| Windows | **HIGH** | ~70% | NSIS Installer + Electron |
| macOS | Medium | ~25% | DMG + Electron |
| Linux | Low | ~5% | AppImage / Snap |

---

## 🪟 Windows Solution (TOP PRIORITY)

### Phase 1: Portable Executable (Immediate - v2.1)

**What**: Bundle everything into a folder that runs without installation

**How**:
1. Use `pkg` or `nexe` to compile Node.js + app into .exe
2. Include all dependencies
3. Create `START_OVERLAY.bat` for easy launch
4. Bundle in ZIP file

**Structure**:
```
StreamOverlay-Portable/
├── StreamOverlay.exe           # Main executable
├── START.bat                   # Double-click to start
├── config/                     # User configs
├── data/                       # Persistent data
├── emotes/                     # Custom emotes
└── README.txt                  # Quick start
```

**Pros**:
- ✅ No installation needed
- ✅ Run from USB
- ✅ Quick to implement
- ✅ Good for testing

**Cons**:
- ❌ No auto-start
- ❌ Manual updates
- ❌ No system integration

**Tools Needed**:
- `pkg` - https://github.com/vercel/pkg
- OR `nexe` - https://github.com/nexe/nexe

**Implementation**:
```bash
# Install pkg
npm install -g pkg

# Build
pkg . --targets node18-win-x64 --output dist/StreamOverlay.exe

# Bundle with batch file and configs
```

**Time Estimate**: 1 week

---

### Phase 2: Electron Desktop App (v2.2)

**What**: Native Windows application with system tray

**Why Electron**:
- ✅ Reuse existing React code
- ✅ Native system tray
- ✅ Auto-updater built-in
- ✅ Code signing support
- ✅ Professional installer

**Features**:
- System tray icon (minimize to tray)
- Auto-start with Windows
- One-click "Open Customize"
- "Copy OBS URL" in tray menu
- Built-in update checker

**Structure**:
```
src/
├── main/                       # Electron main process
│   ├── index.js               # Entry point
│   ├── tray.js                # System tray
│   ├── autoUpdater.js         # Update logic
│   └── server.js              # Express server
├── renderer/                   # Current React app
│   ├── Display.jsx
│   ├── Customize.jsx
│   └── ...
└── shared/                     # Shared utilities
```

**Tools**:
- `electron` - Desktop framework
- `electron-builder` - Build & package
- `electron-updater` - Auto-updates

**Implementation**:
```bash
# Install dependencies
npm install electron electron-builder electron-updater

# Add to package.json
{
  "main": "src/main/index.js",
  "build": {
    "appId": "com.streamoverlay.app",
    "productName": "Stream Overlay",
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    }
  }
}

# Build
npm run electron:build
```

**Time Estimate**: 2-3 weeks

---

### Phase 3: NSIS Installer (v2.3)

**What**: Professional Windows installer

**Features**:
- ✅ Install to Program Files
- ✅ Start Menu shortcuts
- ✅ Desktop shortcut (optional)
- ✅ Auto-start option
- ✅ Uninstaller
- ✅ Version detection
- ✅ Silent install option

**Created with**: `electron-builder` (includes NSIS)

**Installer Options**:
```
[✓] Create desktop shortcut
[✓] Start with Windows
[✓] Add to Start Menu
[ ] Launch after installation
```

**Installation Path**: `C:\Program Files\StreamOverlay\`

**Shortcuts**:
- Desktop: `Stream Overlay.lnk`
- Start Menu: `Stream Overlay\Stream Overlay.lnk`
- Start Menu: `Stream Overlay\Customize.lnk`

**Time Estimate**: 1 week (with Electron)

---

## 🍎 macOS Solution

### Phase 1: .app Bundle (v2.5)

**What**: Native macOS application

**Same Electron approach as Windows**

**Features**:
- Menu bar application
- Dock icon
- Launch at login
- Notification support

**Distribution**:
1. DMG file (drag to Applications)
2. Homebrew cask (for power users)

**Code Signing**:
- Apple Developer Account required ($99/year)
- Notarization for Gatekeeper
- Prevents "unidentified developer" warning

**Installation**:
```bash
# Download DMG
open StreamOverlay.dmg

# Drag to Applications
# Double-click to run
```

**Time Estimate**: 2 weeks

---

## 🐧 Linux Solution (Low Priority)

### Options:

**AppImage** (Recommended):
- Single file, works everywhere
- No installation needed
- `chmod +x StreamOverlay.AppImage && ./StreamOverlay.AppImage`

**Snap**:
- Ubuntu App Store
- `snap install stream-overlay`

**Flatpak**:
- Flathub distribution
- `flatpak install stream-overlay`

**Time Estimate**: 1 week

---

## 🚀 Quick Win: Improved Current Setup

### Make current method easier (Immediate - This Week)

**Current Pain Points**:
1. Must install Node.js manually
2. Must run `npm install`
3. Must run `npm start`
4. Must keep terminal open

**Solutions**:

#### 1. Better Batch File (Done!)
- ✅ Auto-detects first run
- ✅ Runs `npm install` if needed
- ✅ Better visual feedback
- ✅ Clear instructions

#### 2. Setup Wizard (Quick - 2 days)
Create `setup.html` that opens automatically:

```
┌─────────────────────────────────┐
│  Welcome to Stream Overlay!     │
│                                 │
│  Step 1: Install Node.js        │
│  [Download Node.js]             │
│                                 │
│  Step 2: Setup Twitch API       │
│  [Open Twitch Dev Console]      │
│                                 │
│  Step 3: Configure Overlay      │
│  [Open Customize Page]          │
│                                 │
│  [✓] Don't show again           │
└─────────────────────────────────┘
```

#### 3. Pre-Built Binary (1 week)
- Download includes Node.js runtime
- No separate installation needed
- Just extract and run

---

## 📦 Distribution Channels

### Official Website
- Landing page with download buttons
- Separate downloads for each platform
- Version history
- Installation guides

### GitHub Releases
- Automatic builds via GitHub Actions
- `.exe`, `.dmg`, `.AppImage` attachments
- Release notes
- Source code

### Future Considerations
- Microsoft Store (Windows)
- Mac App Store (macOS - requires $99/year)
- Flathub (Linux)
- Homebrew cask (macOS)

---

## 🔧 Technical Implementation Plan

### Week 1-2: Portable Windows (v2.1)
```bash
# Package with pkg
npm install -g pkg
pkg . --targets node18-win-x64

# Test on clean Windows VM
# Create portable ZIP
# Release on GitHub
```

### Week 3-5: Electron App (v2.2)
```bash
# Setup Electron
npm install electron electron-builder

# Create main process
# Setup system tray
# Add auto-updater

# Test on Windows & macOS
```

### Week 6: NSIS Installer (v2.3)
```bash
# Configure electron-builder
# Create installer scripts
# Test installation/uninstallation
# Code sign (Windows certificate)
```

### Week 7-8: macOS App (v2.5)
```bash
# Same Electron codebase
# Create DMG
# Code sign (Apple cert)
# Notarize with Apple
```

---

## 💰 Costs

### Required:
- **None** - All tools are free/open-source

### Optional (Professional):
- **Windows Code Signing**: ~$200/year
  - Prevents SmartScreen warnings
  - Builds user trust
  
- **Apple Developer Account**: $99/year
  - Required for code signing
  - Required for notarization
  - Required for App Store (if desired)

### Total Annual Cost:
- **Free version**: $0
- **Signed version**: $300/year

---

## 🎯 Recommended Immediate Actions

### This Week:
1. ✅ **Better batch file** (DONE)
2. ✅ **Setup guide** (DONE)
3. [ ] **Pre-check script** - Verify Node.js installed
4. [ ] **Setup wizard HTML** - Interactive first-run

### Next Week (v2.1):
1. [ ] **Portable .exe** with `pkg`
2. [ ] **Automated ZIP creation**
3. [ ] **GitHub release automation**
4. [ ] **Download page**

### Month 2 (v2.2):
1. [ ] **Electron app** - Windows first
2. [ ] **System tray** icon
3. [ ] **Auto-updater**
4. [ ] **Professional installer**

### Month 3 (v2.5):
1. [ ] **macOS version**
2. [ ] **Code signing** (both platforms)
3. [ ] **Documentation updates**
4. [ ] **Marketing materials**

---

## 🧪 Testing Strategy

### Clean Install Testing:
- Fresh Windows 10 VM
- Fresh Windows 11 VM
- Fresh macOS Monterey VM
- Fresh macOS Ventura VM

### User Testing:
- 10 beta testers (mix of technical levels)
- Installation time tracking
- Issue reporting
- Feedback survey

### Automation:
- GitHub Actions for builds
- Automated release creation
- Version bumping
- Changelog generation

---

## 📝 Documentation Needed

1. **Installation Guide** (per platform)
2. **First-Run Setup** (screenshots)
3. **Troubleshooting** (common issues)
4. **Upgrade Guide** (from older versions)
5. **Uninstall Instructions**
6. **Video Tutorials** (YouTube)

---

## 🎬 Success Criteria

### Setup must be:
- ⏱️ **Under 5 minutes** - From download to working
- 👶 **Beginner-friendly** - No terminal commands
- 🔄 **Auto-updating** - One-click updates
- 💪 **Reliable** - Works 95%+ of the time
- 📱 **Modern UI** - Looks professional

### User feedback target:
- 90%+ installation success rate
- 4.5+ stars average rating
- < 5% support requests about installation

---

**Priority**: Windows Portable → Windows Installer → macOS App  
**Timeline**: 2-3 months for complete solution  
**Current Status**: Setup guides created, batch files ready  
**Next Step**: Build portable Windows executable with `pkg`
