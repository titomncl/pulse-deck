import React from "react";

export default function ElementList({
  elements = [],
  selectedElement,
  setSelectedElement,
  updatePreviewElement,
  deleteElement,
  addNewElement,
  duplicateElement,
}) {
  return (
    <div className="elements-list">
      <h2>Select Element to Customize</h2>
      {(Array.isArray(elements) ? elements : []).map((element) => (
        <div
          key={element.id}
          className={`element-item ${selectedElement === element.id ? "selected" : ""} ${
            !element.enabled ? "disabled" : ""
          }`}
          onClick={() => setSelectedElement(element.id)}
        >
          <input
            type="checkbox"
            checked={element.enabled}
            onChange={(e) => {
              e.stopPropagation();
              updatePreviewElement(element.id, { enabled: e.target.checked });
            }}
            title={element.enabled ? "Hide element" : "Show element"}
          />
          <span className="element-title">{element.title || element.id}</span>
          {!element.enabled && <span className="element-status-badge">Hidden</span>}
          <button
            className="delete-element-btn"
            onClick={(e) => {
              e.stopPropagation();
              deleteElement(element.id);
            }}
            title="Delete element"
          >
            ✕
          </button>
        </div>
      ))}
      <button onClick={addNewElement} className="add-element-btn">
        + Add New Element
      </button>
      <button
        onClick={() => duplicateElement && duplicateElement(selectedElement)}
        className="duplicate-element-btn"
        disabled={!selectedElement}
        title={selectedElement ? "Duplicate selected element" : "Select an element to duplicate"}
      >
        ⧉ Duplicate Selected
      </button>
    </div>
  );
}
