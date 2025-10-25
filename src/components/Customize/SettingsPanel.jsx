import React from "react";

export default function SettingsPanel({
  previewConfig,
  updatePreviewGlobal,
  availableEmotes = [],
  handleEmoteUpload,
  handleDeleteEmote,
  loadAvailableEmotes,
}) {
  if (!previewConfig) return null;

  return (
    <div className="settings-panel">
      <h2>Global Settings</h2>

      <div className="control-group">
        <label>Rotation Duration (seconds)</label>
        <input
          type="number"
          min="1"
          max="60"
          value={(previewConfig.rotationDuration || 5000) / 1000}
          onChange={(e) => updatePreviewGlobal({ rotationDuration: parseInt(e.target.value) * 1000 || 5000 })}
        />
        <small>How long each panel is displayed before rotating</small>
      </div>

      <div className="control-group">
        <label>⚠️ Animation Settings Moved</label>
        <div className="field-hint">
          Animations are now customized per-element! Edit each element to choose its own animation style.
        </div>
      </div>

      <h3>YouTube Channel</h3>
      <div className="control-group">
        <label>YouTube Channel ID</label>
        <input
          type="text"
          value={previewConfig.youtube?.channelId || previewConfig.youtubeChannel?.channelId || ""}
          onChange={(e) => updatePreviewGlobal({ youtube: { ...previewConfig.youtube, channelId: e.target.value } })}
          placeholder="UCxxx... (Channel ID)"
        />
        <small>
          Please paste your Channel ID (looks like <code>UCxxxxxxxxxxxxxxxx</code>).
          <br />
          You can find it on your YouTube Advanced account settings:&nbsp;
          <a href="https://www.youtube.com/account_advanced" target="_blank" rel="noopener noreferrer">
            https://www.youtube.com/account_advanced
          </a>
        </small>
      </div>

      <h3>Emote Library</h3>
      <div className="emote-library">
        <div className="emote-library-header">
          <input
            type="file"
            id="settings-emote-file-input"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={handleEmoteUpload}
            style={{ display: "none" }}
            multiple
          />
          <button
            type="button"
            onClick={() => document.getElementById("settings-emote-file-input").click()}
            className="import-emote-btn"
            title="Upload PNG, JPG, GIF, or WebP images (max 5MB each)"
          >
            📤 Import Emotes
          </button>
          <small>Upload PNG, JPG, GIF, or WebP (max 5MB each)</small>
        </div>

        {availableEmotes.length > 0 ? (
          <div className="emote-grid">
            {availableEmotes.map((emote) => (
              <div key={emote} className="emote-grid-item">
                <img src={`/emotes/${emote}`} alt={emote} className="emote-preview" />
                <span className="emote-filename">{emote}</span>
                <button onClick={() => handleDeleteEmote(emote)} className="delete-emote-btn" title="Delete emote">
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-library-message">
            No emotes imported yet. Click "Import Emotes" above to add images.
          </div>
        )}
      </div>

      <h3>Color Theme</h3>
      <div className="color-grid">
        <div className="control-group">
          <label>Panel Background</label>
          <input
            type="color"
            value={previewConfig.colors?.panelBackground || "#F3F3F3"}
            onChange={(e) =>
              updatePreviewGlobal({ colors: { ...previewConfig.colors, panelBackground: e.target.value } })
            }
          />
        </div>

        <div className="control-group">
          <label>Panel Border</label>
          <input
            type="color"
            value={previewConfig.colors?.panelBorder || "#002740"}
            onChange={(e) => updatePreviewGlobal({ colors: { ...previewConfig.colors, panelBorder: e.target.value } })}
          />
        </div>

        <div className="control-group">
          <label>Primary Text</label>
          <input
            type="color"
            value={previewConfig.colors?.primaryText || "#002740"}
            onChange={(e) => updatePreviewGlobal({ colors: { ...previewConfig.colors, primaryText: e.target.value } })}
          />
        </div>

        <div className="control-group">
          <label>Secondary Text</label>
          <input
            type="color"
            value={previewConfig.colors?.secondaryText || "#666666"}
            onChange={(e) =>
              updatePreviewGlobal({ colors: { ...previewConfig.colors, secondaryText: e.target.value } })
            }
          />
        </div>

        <div className="control-group">
          <label>Progress Bar Background</label>
          <input
            type="color"
            value={previewConfig.colors?.progressBarBackground || "#E0E0E0"}
            onChange={(e) =>
              updatePreviewGlobal({ colors: { ...previewConfig.colors, progressBarBackground: e.target.value } })
            }
          />
        </div>

        <div className="control-group">
          <label>Progress Bar Fill</label>
          <input
            type="color"
            value={previewConfig.colors?.progressBarFill || "#002740"}
            onChange={(e) =>
              updatePreviewGlobal({ colors: { ...previewConfig.colors, progressBarFill: e.target.value } })
            }
          />
        </div>

        <div className="control-group">
          <label>Progress Bar Fill End (Gradient)</label>
          <input
            type="color"
            value={previewConfig.colors?.progressBarFillEnd || "#004d73"}
            onChange={(e) =>
              updatePreviewGlobal({ colors: { ...previewConfig.colors, progressBarFillEnd: e.target.value } })
            }
          />
        </div>

        <div className="control-group">
          <label>Accent Color</label>
          <input
            type="color"
            value={previewConfig.colors?.accentColor || "#9146ff"}
            onChange={(e) => updatePreviewGlobal({ colors: { ...previewConfig.colors, accentColor: e.target.value } })}
          />
        </div>
      </div>
    </div>
  );
}
