# Changelog - Dynamic Elements System

# Changelog

## Version 0.1.0 - Initial Alpha Release

### 🎉 Major Features

#### Dynamic Element System
- **Unlimited Elements**: Add, edit, or remove any number of overlay elements
- **5 Element Types**: Progress bars, counters, lists, info panels, and custom HTML
- **No Hard-Coding**: All elements are now data-driven and user-configurable
- **Full Customization**: Every aspect of each element can be customized

#### User Default Configurations
- **Save Your Setup**: "Save as My Default" button to remember your configuration
- **Quick Restore**: "Reset to My Default" to restore your saved setup
- **Factory Reset**: "Reset to Factory Default" to restore original configuration
- **Persistent Defaults**: User defaults saved in `user-default-config.json`

### 🔧 Technical Changes

#### New Files
- `default-config.json` - Factory default configuration
- `src/utils/elementRenderer.js` - Dynamic element rendering system
- `DYNAMIC_ELEMENTS_GUIDE.md` - Complete user documentation

#### Modified Files
- `server.js` - Added endpoints for default config management
- `src/config.js` - Added functions for saving/loading user defaults
- `src/pages/Display.jsx` - Refactored to use dynamic element rendering
- `src/pages/Customize.jsx` - Complete UI overhaul for element management
- `src/components/Preview.jsx` - Updated to support dynamic elements
- `overlay-config.json` - Migrated to new array-based format

#### API Endpoints Added
- `GET /api/config/default` - Get factory default configuration
- `GET /api/config/user-default` - Get user's default configuration
- `POST /api/config/user-default` - Save current config as user default
- `POST /api/config/reset-factory` - Reset to factory default
- `POST /api/config/reset-user` - Reset to user default

### 📊 Element Types

#### 1. Progress Bar (`type: "progress"`)
- Goal tracking with current/target values
- Automatic data from Twitch (followers, subscribers)
- Optional percentage display
- Visual progress bar with gradient

#### 2. Counter (`type: "counter"`)
- Simple numeric displays
- Configurable prefix/suffix ($ , €, pts, etc.)
- Manual or data source values

#### 3. List (`type: "list"`)
- Multiple items display
- Carousel mode (one at a time)
- Links to chat commands or custom lists
- Configurable item count

#### 4. Info (`type: "info"`)
- Text and image panels
- Main text and subtext
- Optional thumbnail display

#### 5. Custom (`type: "custom"`)
- Full HTML support
- Complete freedom for advanced users
- Use at your own risk

### 🔗 Data Sources

Elements can pull data from multiple sources:
- `none` - Manual values
- `twitch.followers` - Live follower count
- `twitch.subscribers` - Live subscriber count
- `twitch.vods` - Latest VOD information
- `config.chatCommands` - Chat commands list
- `custom.donations` - Custom donation tracking

### 🔄 Migration & Backward Compatibility

#### Automatic Migration
- Old object-based configs automatically convert to new array format
- All existing elements preserved during migration
- No manual intervention required
- Old functionality remains identical

#### Config Format Changes

**Old Format (Object):**
```json
{
  "elements": {
    "followerGoal": {
      "enabled": true,
      "goal": 1000
    }
  }
}
```

**New Format (Array):**
```json
{
  "elements": [
    {
      "id": "followerGoal",
      "type": "progress",
      "enabled": true,
      "fields": {
        "goal": 1000
      }
    }
  ]
}
```

### 🎨 UI Improvements

#### Customize Page
- **Add Element Button**: Create new elements with one click
- **Delete Buttons**: Remove unwanted elements easily
- **Type Selector**: Change element type on the fly
- **Field Editor**: Dynamic forms based on element type
- **Data Source Picker**: Choose where data comes from
- **Default Actions**: Three new buttons for configuration management

#### Preview Panel
- Shows current element name/type
- Displays carousel item names for lists
- Real-time updates as you edit

### 🐛 Bug Fixes
- Fixed hard-coded element limitations
- Resolved issues with adding chat commands
- Improved config sync between Display and Customize pages

### 📝 Documentation
- New `DYNAMIC_ELEMENTS_GUIDE.md` with complete system documentation
- Updated `README.md` with new features
- Added configuration format examples
- Included migration guide

### ⚠️ Breaking Changes
- Element configuration structure changed from object to array
- Automatic migration handles this, but custom integrations may need updates
- `getElementLabel()` function removed from Customize.jsx
- Hard-coded element types deprecated

### 🔮 Future Possibilities
- Import/export configurations
- Element templates library
- Conditional display rules
- Per-element animation settings
- More data sources (YouTube, Discord, etc.)
- Element presets marketplace

---

## Migration Instructions

### If You're Updating From Previous Version:

1. **Backup Your Config**: Save a copy of `overlay-config.json`
2. **Start Server**: Run `npm start`
3. **Automatic Migration**: Config converts automatically on load
4. **Save as Default**: Click "Save as My Default" to preserve your setup
5. **Test Elements**: Verify all elements work as expected

### If Something Goes Wrong:

1. **Reset to Factory**: Click "Reset to Factory Default"
2. **Restore Backup**: Replace `overlay-config.json` with your backup
3. **Manual Edit**: Edit config file directly if needed
4. **Check Console**: Browser console shows error messages

---

**Full documentation available in `DYNAMIC_ELEMENTS_GUIDE.md`**
