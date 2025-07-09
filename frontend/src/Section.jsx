import React, { useState, useEffect } from 'react';

// Кружок прогресса SVG
function ProgressCircle({ percent, stroke = 4 }) {
  const [circleSize, setCircleSize] = useState(28);

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth <= 480) {
        setCircleSize(20);
      } else if (window.innerWidth <= 768) {
        setCircleSize(24);
      } else {
        setCircleSize(28);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const radius = (circleSize - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - percent / 100);
  
  return (
    <svg 
      className="progress-circle" 
      viewBox={`0 0 ${circleSize} ${circleSize}`} 
      style={{ width: `${circleSize}px`, height: `${circleSize}px` }}
    >
      <circle
        cx={circleSize / 2}
        cy={circleSize / 2}
        r={radius}
        stroke="#e0f1fa"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={circleSize / 2}
        cy={circleSize / 2}
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

function Section({ title, filled, progressPercent = 0, children, open, onClick, onEdit, isEditing }) {
  return (
    <div className="profile-section">
      <div className={`profile-section-header ${filled ? 'complete' : 'incomplete'}`} onClick={onClick}>
        <span>{title}</span>
        <div className="profile-section-indicators">
          {!isEditing && onEdit && (
            <button 
              className="profile-section-edit" 
              onClick={e => { e.stopPropagation(); onEdit(); }}
              style={{
                background: '#a770ef',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '0.85rem',
                fontWeight: '600',
                height: '28px',
                width: 'auto',
                minWidth: '50px',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                marginLeft: '0',
                lineHeight: '1'
              }}
              onMouseOver={e => e.target.style.background = '#a770efcc'}
              onMouseOut={e => e.target.style.background = '#a770ef'}
            >
              Edit
            </button>
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