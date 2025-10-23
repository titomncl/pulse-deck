# Easy Setup Guide - Stream Overlay

> Simple installation for streamers. No coding required!

## 🎯 Choose Your Platform

- [Windows Setup](#windows-setup-recommended) (70% of streamers)
- [macOS Setup](#macos-setup)
- [Advanced Setup](#advanced-setup-for-developers)

---

## 🪟 Windows Setup (Recommended)

### Method 1: One-Click Installer (Coming Soon)

**Will include:**
- ✅ Automatic installation
- ✅ Desktop & Start Menu shortcuts
- ✅ Auto-start with Windows option
- ✅ System tray application
- ✅ Auto-updates

**Status:** In development (Target: v2.1)

---

### Method 2: Portable Version (Current)

**No installation needed - Perfect for USB sticks or quick testing**

#### Download & Extract
1. Download `StreamOverlay-Portable-Windows.zip`
2. Extract to any folder (e.g., `C:\StreamOverlay\`)
3. That's it! No installation needed.

#### First Run
1. Double-click `START_OVERLAY.bat`
2. A command window opens (keep it open)
3. Browser opens automatically to customize page
4. If not, open: `http://localhost:3000/customize`

#### Add to OBS
1. In customize page, click "🔗 Generate OBS URL"
2. Copy the URL
3. In OBS:
   - **Sources** → **Add** → **Browser**
   - **Name:** Stream Overlay
   - **URL:** Paste the copied URL
   - **Width:** 1920
   - **Height:** 1080
   - ✅ Check "Shutdown source when not visible"
   - Click **OK**

#### Stop Server
- Close the command window OR
- Press `Ctrl+C` in the command window

---

### Method 3: Manual Setup (Current - For Tech-Savvy Users)

#### Requirements
- Windows 10 or 11
- 4GB RAM minimum
- Internet connection (for setup only)

#### Step 1: Install Node.js
1. Go to https://nodejs.org
2. Download **LTS version** (recommended)
3. Run installer
4. Click **Next** → **Next** → **Install**
5. Restart computer

#### Step 2: Download Overlay
1. Download this repository as ZIP
2. Extract to folder: `C:\StreamOverlay\`

#### Step 3: Install Dependencies
1. Open File Explorer
2. Navigate to `C:\StreamOverlay\`
3. Type `cmd` in address bar, press Enter
4. In command window, type:
```batch
npm install
```
5. Wait for installation (2-5 minutes)

#### Step 4: Start Server
In same command window:
```batch
npm start
```

Browser opens automatically. Keep command window open!

---

## 🍎 macOS Setup

### Method 1: macOS App (Coming Soon)

**Will include:**
- ✅ DMG installer
- ✅ Dock icon
- ✅ Menu bar application
- ✅ Auto-updates
- ✅ Code signed

**Status:** Planned (Target: v2.5)

---

### Method 2: Manual Setup (Current)

#### Requirements
- macOS 10.15 (Catalina) or newer
- 4GB RAM minimum
- Internet connection (for setup)

#### Step 1: Install Homebrew (if not installed)
Open Terminal (Cmd+Space, type "Terminal"):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Step 2: Install Node.js
```bash
brew install node
```

#### Step 3: Download Overlay
1. Download repository as ZIP
2. Extract to folder: `~/StreamOverlay/`

#### Step 4: Install Dependencies
```bash
cd ~/StreamOverlay
npm install
```

#### Step 5: Start Server
```bash
npm start
```

Browser opens automatically!

---

## 🚀 Quick Start After Installation

### 1. Setup Twitch API (One-Time)

**Get Credentials:**
1. Go to https://dev.twitch.tv/console/apps
2. Sign in with Twitch
3. Click "Register Your Application"
4. **Name:** My Stream Overlay
5. **OAuth Redirect URLs:** http://localhost:3000
6. **Category:** Broadcasting Suite
7. Click **Create**
8. Copy **Client ID**

**Generate Token:**
1. Go to https://twitchtokengenerator.com
2. Select these scopes:
   - `channel:read:subscriptions`
   - `moderator:read:followers`
3. Click "Generate Token"
4. Copy the token

**Enter in Overlay:**
1. Open customize page
2. Paste Client ID and Token
3. Click "Save"

### 2. Create Your First Element

1. Click **"+ Add New Element"**
2. Choose type: **Progress**
3. Set:
   - **Title:** Follower Goal
   - **Emote:** 👥
   - **Data Source:** Twitch Followers
   - **Goal:** 1000
4. Click **"Apply Changes"**

### 3. Add to OBS

1. Click **"🔗 Generate OBS URL"**
2. Copy URL
3. In OBS: Add **Browser Source**
4. Paste URL, set 1920x1080
5. Done! 🎉

---

## 🔄 Auto-Start with Windows

### Option 1: Batch File (Simple)

1. Create file: `START_OVERLAY.bat`
```batch
@echo off
cd /d "C:\StreamOverlay"
start npm start
```

2. Press `Win+R`
3. Type: `shell:startup`
4. Copy `START_OVERLAY.bat` here

### Option 2: Task Scheduler (Better)

1. Open **Task Scheduler**
2. **Create Basic Task**
3. **Name:** Stream Overlay
4. **Trigger:** At log on
5. **Action:** Start a program
6. **Program:** `C:\Program Files\nodejs\npm.cmd`
7. **Arguments:** `start`
8. **Start in:** `C:\StreamOverlay`

---

## 🔄 Auto-Start with macOS

### Option 1: LaunchAgent (Recommended)

Create file: `~/Library/LaunchAgents/com.streamoverlay.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.streamoverlay</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npm</string>
        <string>start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/StreamOverlay</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.streamoverlay.plist
```

### Option 2: Login Items

1. **System Preferences** → **Users & Groups**
2. Select your user → **Login Items**
3. Click **+** → Add your startup script

---

## 🛠️ Troubleshooting

### Windows Issues

**"Node is not recognized"**
- Restart computer after Node.js installation
- Check Node is in PATH: `node --version`

**"Port 3000 is already in use"**
- Close other apps using port 3000
- Or change port in `server.js`

**Firewall blocking**
- Allow Node.js through Windows Firewall
- Settings → Firewall → Allow an app

### macOS Issues

**"Command not found: npm"**
- Reinstall Node.js via Homebrew
- Check PATH: `echo $PATH`

**Permission denied**
- Use: `sudo npm install` (not recommended)
- Better: Fix npm permissions
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
```

**Port already in use**
- Find process: `lsof -i :3000`
- Kill it: `kill -9 [PID]`

### Common Issues

**Overlay not showing in OBS**
- Check URL is correct
- Verify server is running
- Try refreshing browser source

**Twitch data not loading**
- Check API credentials
- Verify token not expired
- Test connection in customize page

**Changes not applying**
- Click "Apply Changes" button
- Check WebSocket connection
- Restart server if needed

---

## 📦 Backup Your Configuration

### Windows
Configuration stored in:
```
C:\StreamOverlay\overlay-config.json
C:\StreamOverlay\user-default-config.json
```

**Backup:**
1. Copy these files to safe location
2. Or use "📤 Export Config" button (coming soon)

### macOS
Configuration stored in:
```
~/StreamOverlay/overlay-config.json
~/StreamOverlay/user-default-config.json
```

**Backup:**
```bash
cp ~/StreamOverlay/*.json ~/StreamOverlay/backup/
```

---

## 🔄 Updating

### Current Method
1. Download new version
2. Extract to same folder (overwrite files)
3. Run `npm install` again
4. Restart server

### Future (Auto-Update)
- Click "Check for Updates" in app
- Downloads and installs automatically
- Restarts server
- Your config is preserved

---

## 🎯 Next Steps

1. ✅ **Setup complete?** Move to customize page
2. 🎨 **Customize your overlay** - Add elements
3. 💾 **Save as default** - Remember your setup
4. 📺 **Test in OBS** - Verify it works
5. 🚀 **Go live!** - You're ready to stream

---

## 🆘 Need More Help?

- 📖 **README.md** - Full documentation
- 📋 **todo.md** - Roadmap and known issues
- 🐛 **GitHub Issues** - Report bugs
- 💬 **Discussions** - Ask questions
- 📧 **Email:** [support email]

---

**Last Updated:** October 23, 2025  
**Version:** 2.0.0  
**Tested on:** Windows 10/11, macOS 12+

---

Made with ❤️ for streamers. Happy streaming! 🎮🎬
