import '../styles/Customize.css'

const ElementList = ({ elements = [], selectedElement, onSelect, onToggle, onDelete, onAdd }) => {
  return (
    <div className="elements-list">
      <h2>Select Element to Customize</h2>
      {elements.map((element) => (
        <div
          key={element.id}
          className={`element-item ${selectedElement === element.id ? 'selected' : ''} ${!element.enabled ? 'disabled' : ''}`}
          onClick={() => onSelect(element.id)}
        >
          <input
            type="checkbox"
            checked={element.enabled}
            onChange={(e) => {
              e.stopPropagation()
              onToggle(element.id, e.target.checked)
            }}
            title={element.enabled ? 'Hide element' : 'Show element'}
          />
          <span className="element-title">{element.title || element.id}</span>
          {!element.enabled && <span className="element-status-badge">Hidden</span>}
          <button
            className="delete-element-btn"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(element.id)
            }}
            title="Delete element"
          >
            ✕
          </button>
        </div>
      ))}
      <button onClick={onAdd} className="add-element-btn">
        + Add New Element
      </button>
    </div>
  )
}

export default ElementList
