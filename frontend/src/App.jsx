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
  const [openInsight, setOpenInsight] = useState(null);
  const [page, setPage] = useState(0);
  const JOBS_PER_PAGE = 5;

  const fetchRecs = async () => {
    if (!user || !user.id || !user.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/recommendations?user_id=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const data = await res.json();
      setRecs(data);
      setPage(0); // Reset to first page on new fetch
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id && user.token) fetchRecs();
    // eslint-disable-next-line
  }, [user]);

  // Message for empty recommendations
  const emptyMessage = (
    <div style={{
      background: '#fff6f6',
      color: '#c94a4a',
      border: '1.5px solid #e57373',
      borderRadius: 10,
      padding: '18px 22px',
      margin: '32px auto',
      maxWidth: 520,
      textAlign: 'center',
      fontSize: '1.13rem',
      fontWeight: 500,
      boxShadow: '0 2px 12px rgba(231,59,59,0.07)'
    }}>
      <span role="img" aria-label="info" style={{fontSize:'1.5em',marginRight:8}}>ℹ️</span>
      Чтобы получить персональные рекомендации, заполните раздел <b>Job Preferences</b> в профиле: желаемая должность, город, формат работы, график, индустрии и навыки. Чем больше информации — тем лучше рекомендации!
    </div>
  );

  // Styles for job card and AI insight popover
  const cardStyle = {
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(59,180,231,0.10)',
    border: '1.5px solid #e0f1fa',
    padding: '1.5rem 2rem',
    marginBottom: 18,
    minWidth: '700px',
    maxWidth: '950px',
    width: '200%',
    height: '270px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    position: 'relative',
    transition: 'all 0.2s ease-in-out',
    textAlign: 'left',
  };
  const insightBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.5rem',
    color: '#f9ca24',
    padding: '0 0 0 0.5rem',
  };
  const popoverStyle = {
    position: 'absolute',
    top: '4.5rem',
    right: '2rem',
    zIndex: 10,
    background: '#fff9e0',
    border: '1px solid #f9ca24',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    padding: '1.2rem 1.5rem',
    width: '350px',
    fontSize: '1rem',
    animation: 'fadeIn 0.2s',
  };

  // Pagination logic
  const totalPages = Math.ceil(recs.length / JOBS_PER_PAGE);
  const paginatedJobs = recs.slice(page * JOBS_PER_PAGE, (page + 1) * JOBS_PER_PAGE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="page">
      <h2 style={{marginBottom: 18, fontSize: '2.1rem', fontWeight: 700, letterSpacing: 0.2}}>Recommendations</h2>
      {(!user || !user.id || !user.token)
        ? <div style={{textAlign:'center',marginTop:40}}><h2>Please log in to view recommendations.</h2></div>
        : <>
            <button onClick={fetchRecs} disabled={loading} style={{marginBottom: 18}}>{loading ? 'Refreshing...' : 'Refresh'}</button>
            {error && <div style={{color: 'red', marginTop: 10}}>{error}</div>}
            <div className="jobs-list" style={{display:'flex',flexDirection:'column',alignItems:'center',marginTop:24, width:'100%'}}>
              {paginatedJobs.length === 0 && !loading && emptyMessage}
              {paginatedJobs.map((rec, i) => (
                <div className="job-card" key={rec.id || i} style={cardStyle}>
                  {/* Header */}
                  <div style={{ flexShrink: 0, paddingBottom: '0.5rem', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                          {rec.title}
                          {(rec.format || rec.location) && (
                            <span style={{ fontWeight: 400, fontSize: '1.08rem', color: '#888', marginLeft: 8 }}>
                              (
                              {rec.format ? rec.format : ''}
                              {rec.format && rec.location ? ', ' : ''}
                              {rec.location ? rec.location : ''}
                              )
                            </span>
                          )}
                        </h3>
                        {rec.reasons && rec.reasons.length > 0 && (
                          <button style={insightBtnStyle} title="AI Insight" onClick={() => setOpenInsight(openInsight === rec.id ? null : rec.id)}>💡</button>
                        )}
                      </div>
                      {rec.salary && <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#23243a', textAlign: 'left' }}>Salary: {rec.salary}</span>}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="job-description" style={{ flex: 1, overflowY: 'auto', lineHeight: 1.5, padding: '8px 12px', margin: '0.5rem 0', width: '100%', background: '#f8fafd', borderRadius: 8, fontSize: '1.05rem', color: 'var(--text-main)', textAlign: 'left', height: '80px', maxHeight: '80px' }}>
                    {rec.description}
                  </div>

                  {/* Footer */}
                  <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0', width: '100%' }}>
                    {/* Contact info as link if URL */}
                    {rec.contact_info && (/^(https?:\/\/|t\.me\/|tg:)/i.test(rec.contact_info.trim()) ? (
                      <a
                        href={rec.contact_info.trim().startsWith('http') ? rec.contact_info.trim() : (rec.contact_info.trim().startsWith('t.me') ? `https://${rec.contact_info.trim()}` : rec.contact_info.trim())}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2e7d32', fontWeight: 500, fontSize: '0.95rem', textDecoration: 'underline', wordBreak: 'break-all' }}
                      >
                        {rec.contact_info}
                      </a>
                    ) : (
                      <span style={{ fontWeight: '500', color: '#2e7d32', fontSize: '0.95rem' }}>{rec.contact_info}</span>
                    ))}
                    {rec.link && <a className="job-link" href={rec.link} target="_blank" rel="noopener noreferrer">Подробнее</a>}
                  </div>

                  {/* AI Insight Popover */}
                  {openInsight === rec.id && rec.reasons && rec.reasons.length > 0 && (
                    <div style={popoverStyle} onClick={e => e.stopPropagation()}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}><span role="img" aria-label="AI">🤖</span> AI Insight</h4>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        {rec.reasons.map((r, idx) => <li key={idx} style={{ marginBottom: '0.25rem' }}>{r}</li>)}
                      </ul>
                      <button style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setOpenInsight(null)}>×</button>
                    </div>
                  )}
                </div>
              ))}
              {/* Pagination controls */}
              {paginatedJobs.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 32 }}>
                  <button
                    onClick={() => setPage(page-1)}
                    disabled={!canPrev}
                    style={{
                      background: canPrev ? '#a084e8' : '#f6f6f6',
                      color: canPrev ? '#fff' : '#bbb',
                      fontWeight: 500,
                      fontSize: '1rem',
                      border: 'none',
                      borderRadius: 12,
                      padding: '0.7em 1.5em',
                      minWidth: 110,
                      cursor: canPrev ? 'pointer' : 'not-allowed',
                      opacity: canPrev ? 1 : 0.7,
                      transition: 'background 0.2s',
                    }}
                  >Previous</button>
                  <span style={{ fontWeight: 600, color: '#23243a', fontSize: '1rem', minWidth: 40, textAlign: 'center' }}>{page+1}/{totalPages}</span>
                  <button
                    onClick={() => setPage(page+1)}
                    disabled={!canNext}
                    style={{
                      background: canNext ? '#a084e8' : '#f6f6f6',
                      color: canNext ? '#fff' : '#bbb',
                      fontWeight: 500,
                      fontSize: '1rem',
                      border: 'none',
                      borderRadius: 12,
                      padding: '0.7em 1.5em',
                      minWidth: 110,
                      cursor: canNext ? 'pointer' : 'not-allowed',
                      opacity: canNext ? 1 : 0.7,
                      transition: 'background 0.2s',
                    }}
                  >Next</button>
                </div>
              )}
            </div>
          </>
      }
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
