# Emotes Folder

Place your custom emote/icon images in this folder.

## How to use:
1. Add your image files (PNG, JPG, GIF, etc.) to this folder
2. **Add the filename to `emotes.json`** so it appears in the dropdown selector
3. In the customization interface, select your image from the dropdown

## Important: Update emotes.json
When you add a new image, update `emotes.json` with the filename:
```json
{
  "emotes": [
    "discord.png",
    "donation.png",
    "your-new-image.png"
  ]
}
```

## Supported formats:
- PNG (recommended for transparency)
- JPG/JPEG
- GIF
- SVG
- WEBP

## Tips:
- Use square images for best results (e.g., 100x100px or 256x256px)
- Keep file sizes reasonable (< 500KB)
- Use descriptive filenames
- PNG with transparency works best for icons
