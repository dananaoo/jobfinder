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
              <pre style={{whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'1rem'}}>{JSON.stringify(tryParseJSON(profile.experience), null, 2)}</pre>
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
              <pre style={{whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'1rem'}}>{JSON.stringify(tryParseJSON(profile.education), null, 2)}</pre>
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
              <pre style={{whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'1rem'}}>{JSON.stringify(tryParseJSON(profile.skills), null, 2)}</pre>
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
              <pre style={{whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'1rem'}}>{JSON.stringify(tryParseJSON(profile.languages), null, 2)}</pre>
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
              <pre style={{whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'1rem'}}>{JSON.stringify(tryParseJSON(profile.achievements), null, 2)}</pre>
            ) : <span style={{color:'#c94a4a'}}>Not filled</span>}
          </Section>
        </div>
      )}
    </div>
  );
}

function UploadResume() {
  return <div className="page"><h2>Upload Resume</h2><input type="file" /><button>Upload</button></div>;
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
