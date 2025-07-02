import React from 'react';

function AchievementsList({ achievements }) {
  if (!achievements) return null;
  let items = achievements;
  
  if (typeof achievements === 'string') {
    try { 
      // Пробуем парсить как JSON
      items = JSON.parse(achievements); 
    } catch { 
      // Если не JSON, то парсим как строку с запятыми
      items = achievements.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  
  if (!Array.isArray(items)) items = [items];
  
  return (
    <ul style={{margin:'6px 0 0 0',paddingLeft:18}}>
      {items.map((ach, i) => (
        <li key={i} style={{marginBottom: '4px'}}>{ach}</li>
      ))}
    </ul>
  );
}

export default AchievementsList; 