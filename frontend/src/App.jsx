import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TELEGRAM_ID = '1';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function isFilled(val) {
  if (!val) return false;
  if (typeof val === 'string') return val.trim() && val.trim().toLowerCase() !== 'string';
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

function tryParseJSON(val) {
  try {
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch {
    return val;
  }
}

function Section({ title, filled, children, open, onClick, icon }) {
  return (
    <div className="profile-section">
      <div className={`profile-section-header ${filled ? 'complete' : 'incomplete'}`} onClick={onClick}>
        <span>{title}</span>
        <span className="profile-section-icon">{icon || (filled ? '✅' : '❗️')}</span>
        <span style={{marginLeft: 8}}>{open ? '▼' : '▶'}</span>
      </div>
      {open && <div className="profile-section-content">{children}</div>}
    </div>
  );
}

function ExperienceList({ experience }) {
  if (!experience) return null;
  let items = experience;
  if (typeof experience === 'string') {
    try { items = JSON.parse(experience); } catch { return <div>Invalid format</div>; }
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
          {exp.achievement && <div style={{marginTop:6,color:'#2e7d32'}}><b>Achievement:</b> {exp.achievement}</div>}
        </div>
      ))}
    </div>
  );
}

function EducationList({ education }) {
  if (!education) return null;
  let items = education;
  if (typeof education === 'string') {
    try { items = JSON.parse(education); } catch { return <div>Invalid format</div>; }
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
        <span key={i} style={{background:'#fff6f6',color:'#c94a4a',borderRadius:8,padding:'6px 14px',fontSize:'1rem',marginBottom:4}}>{typeof lang === 'string' ? lang : lang.language + (lang.level ? ` (${lang.level})` : '')}</span>
      ))}
    </div>
  );
}

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

function Home() {
  return <div className="page"><h2>Welcome to TG Jobs MVP</h2><p>Find jobs, upload your resume, and get recommendations!</p></div>;
}

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/jobs`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  return (
    <div className="page">
      <h2>Vacancies</h2>
      <button onClick={fetchJobs} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Jobs'}</button>
      {error && <div style={{color: 'red', marginTop: 10}}>{error}</div>}
      <div className="jobs-list">
        {jobs.length === 0 && !loading && <div>No jobs found.</div>}
        {jobs.map(job => (
          <div className="job-card" key={job.id}>
            <div className="job-title">{job.title}
              {job.location && <span className="job-location">{job.location}</span>}
            </div>
            {job.salary && <div className="job-salary">Salary: {job.salary}</div>}
            <div className="job-description">{job.description}</div>
            {job.published_at && <div className="job-date">Published: {formatDate(job.published_at)}</div>}
            {job.link && <a className="job-link" href={job.link} target="_blank" rel="noopener noreferrer">Подробнее</a>}
          </div>
        ))}
      </div>
    </div>
  );
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

function UploadResume() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profile, setProfile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSuccess(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('telegram_id', TELEGRAM_ID);
      const res = await fetch(`${API_URL}/upload_resume`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload resume');
      const data = await res.json();
      setSuccess(data.message || 'Resume uploaded and profile updated!');
      setProfile(data.profile);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-resume-container">
      <h2>Upload Resume</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
      {error && <div style={{color: '#c94a4a', marginTop: 10}}>{error}</div>}
      {success && <div style={{color: '#2e7d32', marginTop: 10}}>{success}</div>}
      {profile && (
        <div className="job-card">
          <div className="job-title" style={{fontSize: '1.2rem'}}>{profile.full_name || 'No Name'}</div>
          <div style={{color: '#888', marginBottom: 8}}>{profile.email}</div>
          {profile.skills && <div style={{marginBottom: 8}}><b>Skills:</b> {profile.skills}</div>}
          {profile.experience_level && <div style={{marginBottom: 8}}><b>Experience Level:</b> {profile.experience_level}</div>}
          {profile.desired_position && <div style={{marginBottom: 8}}><b>Desired Position:</b> {profile.desired_position}</div>}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <nav className="navbar">
        <Link to="/">Home</Link>
        <Link to="/jobs">Vacancies</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/upload-resume">Upload Resume</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/upload-resume" element={<UploadResume />} />
      </Routes>
    </Router>
  );
}

export default App;
