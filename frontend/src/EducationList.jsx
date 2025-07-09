import React from 'react';
import { useTranslation } from 'react-i18next';

function EducationList({ education }) {
  const { t } = useTranslation();
  if (!education) return null;
  let items = education;
  if (typeof education === 'string') {
    try { items = JSON.parse(education); } catch { return <div>{t('auth.invalid_format')}</div>; }
  }
  if (!Array.isArray(items)) items = [items];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {items.map((ed, i) => (
        <div key={i} style={{background:'#f8f8f8',borderRadius:10,padding:'14px 18px',boxShadow:'0 1px 6px 0 rgba(0,0,0,0.04)'}}>
          <div style={{fontWeight:600,fontSize:'1.08rem',marginBottom:2}}>{ed.university || '—'}</div>
          <div style={{color:'#888',fontSize:'0.98rem',marginBottom:6}}>{ed.degree}</div>
          <div style={{color:'#888',fontSize:'0.98rem'}}>
            {ed.start_date && <span>{ed.start_date}</span>}
            {ed.end_date && <span> — {ed.end_date}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default EducationList; 