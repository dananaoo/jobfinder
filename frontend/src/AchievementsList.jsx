import React from 'react';

function AchievementsList({ achievements }) {
  if (!achievements) return null;
  let items = achievements;
  if (typeof achievements === 'string') {
    try { items = JSON.parse(achievements); } catch { items = [achievements]; }
  }
  if (!Array.isArray(items)) items = [items];
  return (
    <ul style={{margin:'6px 0 0 0',paddingLeft:18}}>
      {items.map((ach, i) => (
        <li key={i}>{ach}</li>
      ))}
    </ul>
  );
}

export default AchievementsList; 