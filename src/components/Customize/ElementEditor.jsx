import React from "react";
// List items editor previously supported "list" elements. That element type was removed from the defaults
// and editor UI; keep the file in repo for backward compatibility but do not import it here.

export default function ElementEditor({
  element,
  updatePreviewElement,
  availableEmotes = [],
  updateListItem,
  addListItem,
  deleteListItem,
  loadAvailableEmotes,
  handleEmoteUpload,
  handleDeleteEmote,
  updatePreviewGlobal,
}) {
  if (!element) return null;

  return (
    <div className="element-controls">
      <h3>Editing: {element.title || element.id}</h3>

      {/* Element Type */}
      <div className="control-group">
        <label>Element Type</label>
        <select
          value={element.type || "info"}
          onChange={(e) => updatePreviewElement(element.id, { type: e.target.value })}
        >
          <option value="progress">Progress Bar (Goals)</option>
          <option value="counter">Counter (Numbers)</option>
          <option value="info">Info (Text & Image)</option>
          <option value="custom">Custom HTML</option>
        </select>
        <small>Changes how this element displays content</small>
      </div>

      {/* Title */}
      <div className="control-group">
        <label>Title</label>
        <input
          type="text"
          value={element.title || ""}
          onChange={(e) => updatePreviewElement(element.id, { title: e.target.value })}
          placeholder="Element title"
        />
      </div>

      {/* Title Size */}
      <div className="control-group">
        <label>Title Size: {element.titleSize || 24}px</label>
        <input
          type="range"
          min="12"
          max="72"
          step="1"
          value={element.titleSize || 24}
          onChange={(e) => updatePreviewElement(element.id, { titleSize: parseInt(e.target.value) })}
          className="title-size-slider"
        />
        <small>Adjust the title font size (px)</small>
      </div>

      {/* Caption / small footer text (optional) - appears below the main body */}
      <div className="control-group">
        <label>Caption (optional)</label>
        <input
          type="text"
          value={element.fields?.subtext || ""}
          onChange={(e) => updatePreviewElement(element.id, { fields: { ...element.fields, subtext: e.target.value } })}
          placeholder="Small caption shown below the main line"
        />
        <small>Appears below the main line as a small caption (grey)</small>
      </div>

      {/* Caption Size - controls the small footer text font */}
      <div className="control-group">
        <label>Caption Size: {element.subtitleSize || 16}px</label>
        <input
          type="range"
          min="8"
          max="36"
          step="1"
          value={element.subtitleSize || 16}
          onChange={(e) => updatePreviewElement(element.id, { subtitleSize: parseInt(e.target.value) })}
          className="subtitle-size-slider"
        />
        <small>Adjust the caption (small text) font size (px)</small>
      </div>

      {/* Emote - hidden for List type as each item has its own */}
      <div className="control-group">
        <label>Emote / Icon</label>
        {availableEmotes.length > 0 ? (
          <div className="emote-picker">
            <div className="emote-picker-grid">
              {availableEmotes.map((emote) => (
                <div
                  key={emote}
                  className={`emote-picker-item ${element.emote === emote ? "selected" : ""}`}
                  onClick={() => updatePreviewElement(element.id, { emote: emote })}
                  title={emote}
                >
                  <img src={`/emotes/${emote}`} alt={emote} className="emote-picker-preview" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-emotes-message">
            No emotes imported yet. Go to Settings → Emote Library to import emotes.
          </div>
        )}

        <input
          type="text"
          value={element.emote || ""}
          onChange={(e) => updatePreviewElement(element.id, { emote: e.target.value })}
          placeholder="emoji (👥) or filename (logo.png)"
        />
        <small>Click emote above or enter emoji/filename manually</small>
      </div>

      {/* Emote/Icon Size Control */}
      <div className="control-group">
        <label>Emote / Icon Size: {element.emoteSize || 100}%</label>
        <input
          type="range"
          min="30"
          max="150"
          step="5"
          value={element.emoteSize || 100}
          onChange={(e) => updatePreviewElement(element.id, { emoteSize: parseInt(e.target.value) })}
          className="emote-size-slider"
        />
        <small>Adjust the size of the emote, icon, or thumbnail (30% - 150%)</small>
      </div>

      {/* Type-specific fields */}
      {element.type === "progress" && (
        <>
          <div className="control-group">
            <label>Current Value (Manual Override)</label>
            <input
              type="number"
              min="0"
              value={element.fields?.current || 0}
              onChange={(e) =>
                updatePreviewElement(element.id, {
                  fields: { ...element.fields, current: parseInt(e.target.value) || 0 },
                })
              }
            />
            <small>Set to 0 to use live data from data source</small>
          </div>

          <div className="control-group">
            <label>Goal Target</label>
            <input
              type="number"
              min="1"
              value={element.fields?.goal || 100}
              onChange={(e) =>
                updatePreviewElement(element.id, {
                  fields: { ...element.fields, goal: parseInt(e.target.value) || 100 },
                })
              }
            />
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={element.fields?.showPercentage !== false}
                onChange={(e) =>
                  updatePreviewElement(element.id, { fields: { ...element.fields, showPercentage: e.target.checked } })
                }
              />{" "}
              Show Percentage
            </label>
          </div>
        </>
      )}

      {element.type === "counter" && (
        <>
          <div className="control-group">
            <label>Value</label>
            <input
              type="number"
              step="0.01"
              value={element.fields?.value || 0}
              onChange={(e) =>
                updatePreviewElement(element.id, {
                  fields: { ...element.fields, value: parseFloat(e.target.value) || 0 },
                })
              }
            />
            <span className="field-hint">
              {element.dataSource === "custom.donations" && (
                <>
                  ⚠️ Twitch API does not track donations. Update this manually or integrate with
                  StreamElements/Streamlabs (v0.2+)
                </>
              )}
              {element.dataSource?.startsWith("twitch.") && <>This value is auto-updated from Twitch API</>}
              {(!element.dataSource || element.dataSource === "none") && <>Manual value - update as needed</>}
            </span>
          </div>

          <div className="control-group">
            <label>Prefix (optional)</label>
            <input
              type="text"
              value={element.fields?.prefix || ""}
              onChange={(e) =>
                updatePreviewElement(element.id, { fields: { ...element.fields, prefix: e.target.value } })
              }
              placeholder="$ or €"
            />
          </div>

          <div className="control-group">
            <label>Suffix (optional)</label>
            <input
              type="text"
              value={element.fields?.suffix || ""}
              onChange={(e) =>
                updatePreviewElement(element.id, { fields: { ...element.fields, suffix: e.target.value } })
              }
              placeholder="pts or followers"
            />
          </div>
        </>
      )}

      {/* 'list' element type has been removed - list-specific controls are no longer available */}

      {element.type === "info" && (
        <>
          <div className="control-group">
            <label>Subtitle (main line)</label>
            <input
              type="text"
              value={element.fields?.text || ""}
              onChange={(e) =>
                updatePreviewElement(element.id, { fields: { ...element.fields, text: e.target.value } })
              }
              placeholder="Text shown between the title and caption"
            />
          </div>

          <div className="control-group">
            <label>Subtitle Size: {element.descriptionSize || 20}px</label>
            <input
              type="range"
              min="10"
              max="48"
              step="1"
              value={element.descriptionSize || 20}
              onChange={(e) => updatePreviewElement(element.id, { descriptionSize: parseInt(e.target.value) })}
              className="description-size-slider"
            />
            <small>Adjust the subtitle (main line) font size (px)</small>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={element.fields?.showThumbnail === true}
                onChange={(e) =>
                  updatePreviewElement(element.id, { fields: { ...element.fields, showThumbnail: e.target.checked } })
                }
              />{" "}
              Show Thumbnail (if available)
            </label>
            <small>Replaces emote/icon with thumbnail image</small>
          </div>

          {element.dataSource === "youtube.latest" && (
            <div className="control-group">
              <label>Video Selection</label>
              <select
                value={element.fields?.youtubeVideoIndex || 0}
                onChange={(e) =>
                  updatePreviewElement(element.id, {
                    fields: { ...element.fields, youtubeVideoIndex: parseInt(e.target.value) },
                  })
                }
              >
                <option value="0">Latest (most recent)</option>
                <option value="1">2nd most recent</option>
                <option value="2">3rd most recent</option>
                <option value="3">4th most recent</option>
                <option value="4">5th most recent</option>
              </select>
              <small>Select which non-Short video to display (excludes videos under 60 seconds)</small>
            </div>
          )}
        </>
      )}

      {element.type === "custom" && (
        <div className="control-group">
          <label>Custom HTML/Text</label>
          <textarea
            rows="4"
            value={element.fields?.html || element.fields?.text || ""}
            onChange={(e) => updatePreviewElement(element.id, { fields: { ...element.fields, html: e.target.value } })}
            placeholder="Enter custom HTML or text"
          />
          <small>⚠️ Be careful with HTML - use at your own risk</small>
        </div>
      )}

      {/* Display Order / Z-Index */}
      <div className="control-group">
        <label>Display Order</label>
        <input
          type="number"
          min="1"
          value={element.zIndex || 1}
          onChange={(e) => updatePreviewElement(element.id, { zIndex: parseInt(e.target.value) || 1 })}
        />
        <small>Controls the order in the rotation (lower = shown first)</small>
      </div>

      {/* Animation */}
      <div className="control-group">
        <label>Animation</label>
        <select
          value={element.animation || "fadeIn"}
          onChange={(e) => updatePreviewElement(element.id, { animation: e.target.value })}
        >
          <option value="fadeIn">Fade In</option>
          <option value="slideLeft">Slide from Right</option>
          <option value="slideRight">Slide from Left</option>
          <option value="slideUp">Slide from Bottom</option>
          <option value="slideDown">Slide from Top</option>
          <option value="scale">Scale/Zoom</option>
          <option value="none">None (Instant)</option>
        </select>
        <small>How this element's content animates when it appears</small>
      </div>
    </div>
  );
}
