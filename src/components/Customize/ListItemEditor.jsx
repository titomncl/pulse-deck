import React from "react";

export default function ListItemEditor({
  elementId,
  item,
  index,
  availableEmotes = [],
  updateListItem,
  deleteListItem,
}) {
  return (
    <div key={index} className="list-item-card">
      {/* Header with emote and delete */}
      <div className="list-item-header">
        <div className="list-item-emote-display">
          {item.emote &&
          (item.emote.endsWith?.(".png") ||
            item.emote.endsWith?.(".jpg") ||
            item.emote.endsWith?.(".gif") ||
            item.emote.endsWith?.(".webp")) ? (
            <img src={`/emotes/${item.emote}`} alt="" className="list-item-emote-img" />
          ) : (
            <span className="list-item-emote-emoji">{item.emote || "💬"}</span>
          )}
        </div>
        <div className="list-item-title-group">
          <input
            type="text"
            value={item.name}
            onChange={(e) => updateListItem(elementId, index, { name: e.target.value })}
            placeholder="Item name (!command, Title, etc.)"
            className="list-item-name-input"
          />
          <div style={{ marginTop: 6 }}>
            <label style={{ fontSize: 12, display: "block" }}>Name Size: {item.titleSize || 16}px</label>
            <input
              type="range"
              min="10"
              max="48"
              step="1"
              value={item.titleSize || 16}
              onChange={(e) => updateListItem(elementId, index, { titleSize: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <button onClick={() => deleteListItem(elementId, index)} className="delete-list-item-btn" title="Delete item">
          🗑️
        </button>
      </div>

      {/* Fields */}
      <div className="list-item-fields">
        <div className="list-item-field">
          <label className="list-item-label">Description</label>
          <input
            type="text"
            value={item.description}
            onChange={(e) => updateListItem(elementId, index, { description: e.target.value })}
            placeholder="What does this do?"
            className="list-item-input"
          />
          <div style={{ marginTop: 6 }}>
            <label style={{ fontSize: 12, display: "block" }}>Description Size: {item.descriptionSize || 14}px</label>
            <input
              type="range"
              min="10"
              max="36"
              step="1"
              value={item.descriptionSize || 14}
              onChange={(e) => updateListItem(elementId, index, { descriptionSize: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="list-item-field">
          <label className="list-item-label">
            Subtext <span className="optional-label">(optional)</span>
          </label>
          <input
            type="text"
            value={item.subtext || ""}
            onChange={(e) => updateListItem(elementId, index, { subtext: e.target.value })}
            placeholder="Additional info"
            className="list-item-input"
          />
          <div style={{ marginTop: 6 }}>
            <label style={{ fontSize: 12, display: "block" }}>Subtext Size: {item.subtitleSize || 12}px</label>
            <input
              type="range"
              min="8"
              max="28"
              step="1"
              value={item.subtitleSize || 12}
              onChange={(e) => updateListItem(elementId, index, { subtitleSize: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="list-item-field">
          <label className="list-item-label">Emote / Icon</label>
          <input
            type="text"
            value={item.emote || ""}
            onChange={(e) => updateListItem(elementId, index, { emote: e.target.value })}
            placeholder="💬 emoji or filename"
            className="list-item-input"
          />

          <div style={{ marginTop: 6 }}>
            <label style={{ fontSize: 12, display: "block" }}>Emote Size: {item.emoteSize || 100}%</label>
            <input
              type="range"
              min="30"
              max="150"
              step="5"
              value={item.emoteSize || 100}
              onChange={(e) => updateListItem(elementId, index, { emoteSize: parseInt(e.target.value) })}
            />
          </div>

          {availableEmotes.length > 0 && (
            <div className="list-item-emote-picker">
              <div className="emote-picker-grid">
                {availableEmotes.map((emote) => (
                  <div
                    key={emote}
                    className={`emote-picker-item ${item.emote === emote ? "selected" : ""}`}
                    onClick={() => updateListItem(elementId, index, { emote: emote })}
                    title={emote}
                  >
                    <img src={`/emotes/${emote}`} alt={emote} className="emote-picker-preview" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
