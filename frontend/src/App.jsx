import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import Home from './Home.jsx';
import Jobs from './Jobs.jsx';
import Profile from './Profile.jsx';
import AuthModal from './AuthModal.jsx';

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

function UploadResume({ user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profile, setProfile] = useState(null);

  if (!user || !user.id || !user.token) {
    return <div className="page" style={{textAlign:'center',marginTop:40}}><h2>Please log in to upload your resume.</h2></div>;
  }

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
    
    // Получаем пользователя напрямую из localStorage для гарантии
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || !storedUser.id || !storedUser.token) {
      setError('User not authenticated. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const headers = {
        'Authorization': `Bearer ${storedUser.token}` // Используем токен отсюда
      };

      const res = await fetch(`${API_URL}/upload_resume`, {
        method: 'POST',
        headers: headers,
        mode: 'cors',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload resume');
      const data = await res.json();
      setSuccess(data.message || 'Resume processed and profile updated!');
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
      {success && <div style={{color: '#2e7d32', marginTop: 10}}>Resume processed and profile updated!</div>}
    </div>
  );
}

function Recommendations({ user }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!user || !user.id || !user.token) {
    return <div className="page" style={{textAlign:'center',marginTop:40}}><h2>Please log in to view recommendations.</h2></div>;
  }

  const fetchRecs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/recommendations?telegram_id=${TELEGRAM_ID}`);
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const data = await res.json();
      setRecs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecs(); }, []);

  return (
    <div className="page">
      <h2>Recommendations</h2>
      <button onClick={fetchRecs} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
      {error && <div style={{color: 'red', marginTop: 10}}>{error}</div>}
      <div className="jobs-list">
        {recs.length === 0 && !loading && <div>No recommendations found.</div>}
        {recs.map((rec, i) => (
          <div className="job-card" key={rec.id || i}>
            <div className="job-title">{rec.title}
              {rec.location && <span className="job-location">{rec.location}</span>}
            </div>
            {rec.salary && <div className="job-salary">Salary: {rec.salary}</div>}
            <div className="job-description">{rec.description}</div>
            {rec.reasons && Array.isArray(rec.reasons) && (
              <div style={{marginTop:10}}>
                <b>Why recommended:</b>
                <ul style={{margin:'6px 0 0 0',paddingLeft:18}}>
                  {rec.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                </ul>
              </div>
            )}
            {rec.link && <a className="job-link" href={rec.link} target="_blank" rel="noopener noreferrer">Подробнее</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    }
  }, []);

  const handleAuthSuccess = (authData) => {
    const userData = {
        id: authData.user_id,
        token: authData.access_token,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    window.location = '/profile';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <header className="app-header">
        <nav className="header-nav-container">
          <div className="header-left">
            <img src="/final-logo.png" alt="LazyJumys Logo" className="logo" />
            <span className="company-name">LazyJumys</span>
          </div>
          <div className="header-nav">
            <Link to="/">Home</Link>
            <Link to="/jobs">Vacancies</Link>
            {user && <Link to="/profile">Profile</Link>}
            <Link to="/upload-resume">Upload Resume</Link>
            <Link to="/recommendations">Recommendations</Link>
            {user ? (
              <button type="button" onClick={handleLogout} className="logout-button">Logout</button>
            ) : (
              <button type="button" onClick={() => setAuthModalOpen(true)} className="login-button">Login</button>
            )}
          </div>
        </nav>
      </header>
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/upload-resume" element={<UploadResume user={user} />} />
          <Route path="/recommendations" element={<Recommendations user={user}/>} />
        </Routes>
      </main>
      <AuthModal open={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
    </Router>
  );
}

export default App;
