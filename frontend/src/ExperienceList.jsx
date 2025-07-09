import React from 'react';
import { useTranslation } from 'react-i18next';

function ExperienceList({ experience }) {
  const { t } = useTranslation();
  if (!experience) return null;
  let items = experience;
  if (typeof experience === 'string') {
    try { items = JSON.parse(experience); } catch { return <div>{t('auth.invalid_format')}</div>; }
  }
  if (!Array.isArray(items)) items = [items];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {items.map((exp, i) => (
        <div key={i} style={{background:'#f8f8f8',borderRadius:10,padding:'14px 18px',boxShadow:'0 1px 6px 0 rgba(0,0,0,0.04)'}}>
          <div style={{fontWeight:600,fontSize:'1.08rem',marginBottom:2}}>{exp.title || '—'}{exp.company && <span style={{color:'#888',marginLeft:8}}>@ {exp.company}</span>}</div>
          <div style={{color:'#888',fontSize:'0.98rem',marginBottom:6}}>
            {exp.location && <span>{exp.location} </span>}
            {exp.start_date && <span>• {exp.start_date}</span>}
            {exp.end_date && <span> — {exp.end_date}</span>}
          </div>
          {exp.responsibilities && Array.isArray(exp.responsibilities) && (
            <ul style={{margin:'6px 0 0 0',paddingLeft:18}}>
              {exp.responsibilities.map((r, idx) => <li key={idx}>{r}</li>)}
            </ul>
          )}
          {exp.achievement && <div style={{marginTop:6,color:'#2e7d32'}}><b>{t('auth.achievement_label')}:</b> {exp.achievement}</div>}
        </div>
      ))}
    </div>
  );
}

export default ExperienceList; 