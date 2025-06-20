import React from 'react';

function Section({ title, filled, children, open, onClick, icon }) {
  return (
    <div className="profile-section">
      <div className={`profile-section-header ${filled ? 'complete' : 'incomplete'}`} onClick={onClick}>
        <span>{title}</span>
        <div className="profile-section-indicators">
          <span className="profile-section-icon">{icon || (filled ? '✅' : '❗️')}</span>
          <span className="profile-section-toggle">{open ? '▼' : '▶'}</span>
        </div>
      </div>
      {open && <div className="profile-section-content">{children}</div>}
    </div>
  );
}

export default Section; 