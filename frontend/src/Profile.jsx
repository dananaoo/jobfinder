import React, { useState, useEffect } from 'react';
import Section from './Section.jsx';
import ExperienceList from './ExperienceList.jsx';
import EducationList from './EducationList.jsx';
import SkillsList from './SkillsList.jsx';
import LanguagesList from './LanguagesList.jsx';
import AchievementsList from './AchievementsList.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TELEGRAM_ID = '1';

function isFilled(val) {
  if (!val) return false;
  if (typeof val === 'string') return val.trim() && val.trim().toLowerCase() !== 'string';
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

function Profile() {
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

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/profile/${TELEGRAM_ID}`);
      if (!res.ok) throw new Error('Profile not found');
      const data = await res.json();
      setProfile(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  return (
    <div className="page">
      <h2>User Profile</h2>
      <button onClick={fetchProfile} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Profile'}</button>
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
    </div>
  );
}

export default Profile; 