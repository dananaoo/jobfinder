import React from 'react';

function SkillsList({ skills }) {
  if (!skills) return null;

  let items = [];
  if (typeof skills === 'string') {
    try {
      // Сначала пытаемся распарсить как JSON, если это массив в строке
      const parsed = JSON.parse(skills);
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      // Если не JSON, то делим по запятой
      items = skills.split(',').map(s => s.trim()).filter(Boolean);
    }
  } else if (Array.isArray(skills)) {
    items = skills;
  }

  return (
    <div style={{display:'flex', flexWrap:'wrap', gap:10, marginTop:4}}>
      {items.map((skill, i) => (
        <span key={i} style={{background:'#e6eaff', color:'#222', borderRadius:8, padding:'6px 14px', fontSize:'1rem', marginBottom:4}}>
          {skill}
        </span>
      ))}
    </div>
  );
}

export default SkillsList; 