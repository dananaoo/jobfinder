import React from 'react';

function SkillsList({ skills }) {
  if (!skills) return null;
  let items = skills;
  if (typeof skills === 'string') {
    try { items = JSON.parse(skills); } catch { items = [skills]; }
  }
  if (!Array.isArray(items)) items = [items];
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:4}}>
      {items.map((skill, i) => (
        <span key={i} style={{background:'#e6eaff',color:'#222',borderRadius:8,padding:'6px 14px',fontSize:'1rem',marginBottom:4}}>{skill}</span>
      ))}
    </div>
  );
}

export default SkillsList; 