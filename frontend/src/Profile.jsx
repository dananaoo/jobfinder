import React, { useState, useEffect } from 'react';
import Section from './Section.jsx';
import ExperienceList from './ExperienceList.jsx';
import EducationList from './EducationList.jsx';
import SkillsList from './SkillsList.jsx';
import LanguagesList from './LanguagesList.jsx';
import AchievementsList from './AchievementsList.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function isFilled(val) {
  if (!val) return false;
  if (typeof val === 'string') return val.trim() && val.trim().toLowerCase() !== 'string';
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({
    personal: true,
    preferences: false,
    experience: false,
    education: false,
    skills: false,
    languages: false,
    achievements: false
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = null;
        if (user.email) {
          url = `${API_URL}/profile?email=${encodeURIComponent(user.email)}`;
        } else if (user.phone) {
          url = `${API_URL}/profile?phone=${encodeURIComponent(user.phone)}`;
        } else if (user.telegram_id) {
          url = `${API_URL}/profile/${encodeURIComponent(user.telegram_id)}`;
        }
        if (!url) throw new Error('Нет email, телефона или telegram_id');
        const res = await fetch(url);
        if (!res.ok) throw new Error('Profile not found');
        const data = await res.json();
        setProfile(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleEdit = () => {
    setEditForm(profile || {});
    setEditError(null);
    setEditOpen(true);
  };
  const handleEditChange = e => {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      let url = null;
      if (user.email) {
        url = `${API_URL}/profile?email=${encodeURIComponent(user.email)}`;
      } else if (user.phone) {
        url = `${API_URL}/profile?phone=${encodeURIComponent(user.phone)}`;
      }
      if (!url) throw new Error('Нет email или телефона');
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Ошибка при сохранении');
      const data = await res.json();
      setProfile(data);
      setEditOpen(false);
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  if (!user) {
    return <div className="page" style={{textAlign:'center',marginTop:40}}><h2>Профиль</h2><div style={{marginTop:24,fontSize:'1.15rem'}}>Пожалуйста, <b>войдите в аккаунт</b>, чтобы просмотреть свой профиль.</div></div>;
  }

  return (
    <div className="page">
      <h2>User Profile</h2>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
        <button onClick={handleEdit} style={{background:'#3bb4e7',color:'#fff'}}>Edit</button>
      </div>
      <button onClick={()=>window.location.reload()} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Profile'}</button>
      {error && <div style={{color: 'red', marginTop: 10}}>{error}</div>}
      {!profile && !loading && !error && <div>No profile found.</div>}
      {profile && (
        <div className="profile-accordion">
          <Section
            title="Personal Information"
            filled={isFilled(profile.full_name) || isFilled(profile.email) || isFilled(profile.phone_number)}
            open={open.personal}
            onClick={() => setOpen(o => ({...o, personal: !o.personal}))}
            icon={null}
          >
            <div><b>Name:</b> {profile.full_name || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
            <div><b>Email:</b> {profile.email || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
            <div><b>Phone:</b> {profile.phone_number || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
            <div><b>Address:</b> {profile.address || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
            <div><b>Citizenship:</b> {profile.citizenship || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
          </Section>
          <Section
            title="Job Preferences"
            filled={isFilled(profile.desired_position) || isFilled(profile.desired_city) || isFilled(profile.desired_format) || isFilled(profile.desired_work_time)}
            open={open.preferences}
            onClick={() => setOpen(o => ({...o, preferences: !o.preferences}))}
            icon={null}
          >
            <div><b>Desired Position:</b> {profile.desired_position || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
            <div><b>Desired City:</b> {profile.desired_city || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
            <div><b>Desired Format:</b> {profile.desired_format || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
            <div><b>Desired Work Time:</b> {profile.desired_work_time || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
            <div><b>Industries:</b> {profile.industries || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
          </Section>
          <Section
            title="Work Experience"
            filled={isFilled(profile.experience)}
            open={open.experience}
            onClick={() => setOpen(o => ({...o, experience: !o.experience}))}
            icon={null}
          >
            {profile.experience ? (
              <ExperienceList experience={profile.experience} />
            ) : <span style={{color:'#c94a4a'}}>Not filled</span>}
          </Section>
          <Section
            title="Education"
            filled={isFilled(profile.education)}
            open={open.education}
            onClick={() => setOpen(o => ({...o, education: !o.education}))}
            icon={null}
          >
            {profile.education ? (
              <EducationList education={profile.education} />
            ) : <span style={{color:'#c94a4a'}}>Not filled</span>}
          </Section>
          <Section
            title="Skills"
            filled={isFilled(profile.skills)}
            open={open.skills}
            onClick={() => setOpen(o => ({...o, skills: !o.skills}))}
            icon={null}
          >
            {profile.skills ? (
              <SkillsList skills={profile.skills} />
            ) : <span style={{color:'#c94a4a'}}>Not filled</span>}
          </Section>
          <Section
            title="Languages"
            filled={isFilled(profile.languages)}
            open={open.languages}
            onClick={() => setOpen(o => ({...o, languages: !o.languages}))}
            icon={null}
          >
            {profile.languages ? (
              <LanguagesList languages={profile.languages} />
            ) : <span style={{color:'#c94a4a'}}>Not filled</span>}
          </Section>
          <Section
            title="Achievements"
            filled={isFilled(profile.achievements)}
            open={open.achievements}
            onClick={() => setOpen(o => ({...o, achievements: !o.achievements}))}
            icon={null}
          >
            {profile.achievements ? (
              <AchievementsList achievements={profile.achievements} />
            ) : <span style={{color:'#c94a4a'}}>Not filled</span>}
          </Section>
        </div>
      )}
      {editOpen && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:18,boxShadow:'0 4px 32px 0 rgba(59,180,231,0.13)',padding:'32px 28px',minWidth:340,maxWidth:420,width:'100%',position:'relative',color:'#23243a'}}>
            <button onClick={()=>setEditOpen(false)} style={{position:'absolute',top:12,right:16,fontSize:22,background:'none',border:'none',cursor:'pointer',color:'#888'}}>×</button>
            <h2 style={{marginBottom:18,textAlign:'center'}}>Редактировать профиль</h2>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <label>Имя</label>
              <input name="full_name" value={editForm.full_name||''} onChange={handleEditChange} style={inputStyle} />
              <label>Email</label>
              <input name="email" value={editForm.email||''} onChange={handleEditChange} style={inputStyle} />
              <label>Телефон</label>
              <input name="phone_number" value={editForm.phone_number||''} onChange={handleEditChange} style={inputStyle} />
              <label>Адрес</label>
              <input name="address" value={editForm.address||''} onChange={handleEditChange} style={inputStyle} />
              <label>Гражданство</label>
              <input name="citizenship" value={editForm.citizenship||''} onChange={handleEditChange} style={inputStyle} />
              {/* Можно добавить остальные поля по аналогии */}
              {editError && <div style={{color:'#c94a4a',marginTop:2}}>{editError}</div>}
              <button onClick={handleEditSave} disabled={editLoading} style={{marginTop:8,background:'#2e7d32',color:'#fff'}}>{editLoading ? 'Сохраняю...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1.2px solid #e0e0e0',
  fontSize: '1rem',
  background: '#fafbff',
  color: '#23243a',
};

export default Profile; 