import React from 'react';

function LanguagesList({ languages }) {
  if (!languages) return null;
  let items = languages;
  if (typeof languages === 'string') {
    try { items = JSON.parse(languages); } catch { items = [languages]; }
  }
  if (!Array.isArray(items)) items = [items];
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:4}}>
      {items.map((lang, i) => (
        <span key={i} style={{background: 'var(--primary-blue-light)', color: 'var(--text-main)', borderRadius:8, padding:'6px 14px', fontSize:'1rem', marginBottom:4}}>{typeof lang === 'string' ? lang : lang.language + (lang.level ? ` (${lang.level})` : '')}</span>
      ))}
    </div>
  );
}

export default LanguagesList; 