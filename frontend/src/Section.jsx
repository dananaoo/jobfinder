import React from 'react';

// Кружок прогресса SVG
function ProgressCircle({ percent, size = 28, stroke = 4 }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - percent / 100);
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e0f1fa"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#4caf50"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s' }}
      />
    </svg>
  );
}

function Section({ title, filled, progressPercent = 0, children, open, onClick, onEdit, isEditing, icon }) {
  return (
    <div className="profile-section">
      <div className={`profile-section-header ${filled ? 'complete' : 'incomplete'}`} onClick={onClick}>
        <span>{title}</span>
        <div className="profile-section-indicators">
          {!isEditing && onEdit && (
            <span className="profile-section-edit" onClick={e => { e.stopPropagation(); onEdit(); }}>
              ✏️
            </span>
          )}
          <span className="profile-section-icon">
            <ProgressCircle percent={progressPercent} />
          </span>
          <span className="profile-section-toggle">{open ? '▼' : '▶'}</span>
        </div>
      </div>
      {open && <div className="profile-section-content">{children}</div>}
    </div>
  );
}

export default Section; 