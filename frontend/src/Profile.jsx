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
  const [editPersonal, setEditPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editJob, setEditJob] = useState(false);
  const [jobForm, setJobForm] = useState({});

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

  const handleEditPersonal = () => {
    setPersonalForm({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      email: profile.email || '',
      phone: profile.phone || ''
    });
    setEditError(null);
    setEditPersonal(true);
  };
  const handlePersonalChange = e => {
    setPersonalForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handlePersonalSave = async () => {
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
        body: JSON.stringify(personalForm)
      });
      if (!res.ok) throw new Error('Ошибка при сохранении');
      const data = await res.json();
      setProfile(data);
      setEditPersonal(false);
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditJob = () => {
    setJobForm({
      desired_position: profile.desired_position || '',
      desired_city: profile.desired_city || '',
      desired_format: profile.desired_format || '',
      desired_work_time: profile.desired_work_time || '',
      industries: profile.industries || ''
    });
    setEditError(null);
    setEditJob(true);
  };
  const handleJobChange = e => {
    setJobForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleJobSave = async () => {
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
        body: JSON.stringify(jobForm)
      });
      if (!res.ok) throw new Error('Ошибка при сохранении');
      const data = await res.json();
      setProfile(data);
      setEditJob(false);
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
      <button onClick={()=>window.location.reload()} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Profile'}</button>
      {error && <div style={{color: 'red', marginTop: 10}}>{error}</div>}
      {!profile && !loading && !error && <div>No profile found.</div>}
      {profile && (
        <div className="profile-accordion">
          <Section
            title={<span>Personal Information {editPersonal ? null : <span style={{marginLeft:8,cursor:'pointer'}} onClick={e=>{e.stopPropagation();handleEditPersonal();}} title="Edit"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.3 9.3a1 1 0 0 1-.45.26l-4 1a1 1 0 0 1-1.22-1.22l1-4a1 1 0 0 1 .26-.45l9.3-9.3ZM16 4l-1-1-9.3 9.3-1 4 4-1L16 4Z" fill="#888"/></svg></span>}</span>}
            filled={isFilled(profile.full_name) || isFilled(profile.email) || isFilled(profile.phone_number)}
            open={open.personal}
            onClick={() => setOpen(o => ({...o, personal: !o.personal}))}
            icon={editPersonal ? null : null}
          >
            {editPersonal ? (
              <div style={{display:'flex',flexDirection:'column',gap:10,maxWidth:400}}>
                <label>First Name</label>
                <input name="first_name" value={personalForm.first_name} onChange={handlePersonalChange} style={inputStyle} placeholder="First Name" />
                <label>Last Name</label>
                <input name="last_name" value={personalForm.last_name} onChange={handlePersonalChange} style={inputStyle} placeholder="Last Name" />
                <label>Email</label>
                <input name="email" value={personalForm.email} onChange={handlePersonalChange} style={inputStyle} placeholder="Email" />
                <label>Phone</label>
                <input name="phone" value={personalForm.phone} onChange={handlePersonalChange} style={inputStyle} placeholder="Phone" />
                {editError && <div style={{color:'#c94a4a',marginTop:2}}>{editError}</div>}
                <button onClick={handlePersonalSave} disabled={editLoading} style={{marginTop:8,background:'#2e7d32',color:'#fff',alignSelf:'flex-start'}}>{editLoading ? 'Saving...' : 'Save'}</button>
                <button onClick={()=>setEditPersonal(false)} style={{marginTop:8,background:'#c94a4a',color:'#fff',alignSelf:'flex-start'}}>Cancel</button>
              </div>
            ) : (
              <>
                <div><b>Name:</b> {profile.full_name || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
                <div><b>Email:</b> {profile.email || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
                <div><b>Phone:</b> {profile.phone_number || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
                <div><b>Address:</b> {profile.address || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
                <div><b>Citizenship:</b> {profile.citizenship || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
              </>
            )}
          </Section>
          <Section
            title={<span>Job Preferences {editJob ? null : <span style={{marginLeft:8,cursor:'pointer'}} onClick={e=>{e.stopPropagation();handleEditJob();}} title="Edit"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.3 9.3a1 1 0 0 1-.45.26l-4 1a1 1 0 0 1-1.22-1.22l1-4a1 1 0 0 1 .26-.45l9.3-9.3ZM16 4l-1-1-9.3 9.3-1 4 4-1L16 4Z" fill="#888"/></svg></span>}</span>}
            filled={isFilled(profile.desired_position) || isFilled(profile.desired_city) || isFilled(profile.desired_format) || isFilled(profile.desired_work_time)}
            open={open.preferences}
            onClick={() => setOpen(o => ({...o, preferences: !o.preferences}))}
            icon={editJob ? null : null}
          >
            {editJob ? (
              <div style={{display:'flex',flexDirection:'column',gap:10,maxWidth:400}}>
                <label>Desired Position</label>
                <input name="desired_position" value={jobForm.desired_position} onChange={handleJobChange} style={inputStyle} placeholder="Desired Position" />
                <label>City</label>
                <input name="desired_city" value={jobForm.desired_city} onChange={handleJobChange} style={inputStyle} placeholder="City" />
                <label>Work Format</label>
                <input name="desired_format" value={jobForm.desired_format} onChange={handleJobChange} style={inputStyle} placeholder="Work Format" />
                <label>Work Schedule</label>
                <input name="desired_work_time" value={jobForm.desired_work_time} onChange={handleJobChange} style={inputStyle} placeholder="Work Schedule" />
                <label>Industries</label>
                <input name="industries" value={jobForm.industries} onChange={handleJobChange} style={inputStyle} placeholder="Industries" />
                {editError && <div style={{color:'#c94a4a',marginTop:2}}>{editError}</div>}
                <button onClick={handleJobSave} disabled={editLoading} style={{marginTop:8,background:'#2e7d32',color:'#fff',alignSelf:'flex-start'}}>{editLoading ? 'Saving...' : 'Save'}</button>
                <button onClick={()=>setEditJob(false)} style={{marginTop:8,background:'#c94a4a',color:'#fff',alignSelf:'flex-start'}}>Cancel</button>
              </div>
            ) : (
              <>
                <div><b>Desired Position:</b> {profile.desired_position || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
                <div><b>Desired City:</b> {profile.desired_city || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
                <div><b>Desired Format:</b> {profile.desired_format || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
                <div><b>Desired Work Time:</b> {profile.desired_work_time || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
                <div><b>Industries:</b> {profile.industries || <span style={{color:'#c94a4a'}}>Not filled</span>}</div>
              </>
            )}
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