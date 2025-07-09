import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import Home from './Home.jsx';
import Jobs from './Jobs.jsx';
import Profile from './Profile.jsx';
import AuthModal from './AuthModal.jsx';
import LanguageSwitcher from './components/LanguageSwitcher';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TELEGRAM_ID = '1';

function isFilled(val) {
  if (!val) return false;
  if (typeof val === 'string') return val.trim() && val.trim().toLowerCase() !== 'string';
  if (Array.isArray(val)) return val.length > 0;
  return true;
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

function UploadResume({ user, onSessionExpired }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { t } = useTranslation();



  if (!user || !user.id || !user.token) {
    return <div className="page" style={{textAlign:'center',marginTop:40}}><h2>{t('upload.login_required')}</h2></div>;
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSuccess(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError(t('upload.error_no_file'));
      return;
    }
    
    // Получаем пользователя напрямую из localStorage для гарантии
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || !storedUser.id || !storedUser.token) {
      setError(t('upload.error_auth'));
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
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Session expired, trigger auth modal
          if (onSessionExpired) {
            onSessionExpired();
            return;
          }
        }
        throw new Error(t('auth.error_upload_resume'));
              }
        await res.json(); // Получаем ответ, но не используем сообщение с сервера
        setSuccess(t('upload.success'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-resume-container">
      <h2>{t('upload.title')}</h2>
      
      <div className="upload-file-area" onClick={() => document.getElementById('file-input').click()}>
        <div className="upload-icon">📄</div>
        <div className="upload-text">
          {file ? t('upload.file_selected') : t('upload.choose_file')}
        </div>
        <div className="upload-subtext">
          {t('upload.drag_drop')}
        </div>
        <button className="file-input-button" type="button">
          {file ? t('upload.change_file') : t('upload.browse_files')}
        </button>
      </div>

      <input 
        id="file-input"
        type="file" 
        accept="application/pdf" 
        onChange={handleFileChange} 
      />

      {file && (
        <div className="selected-file">
          <span>📄</span>
          <span className="selected-file-name">{file.name}</span>
        </div>
      )}

      {file && (
        <button 
          className="upload-button" 
          onClick={handleUpload} 
          disabled={loading}
        >
          {loading ? t('upload.uploading') : t('upload.upload_button')}
        </button>
      )}

      {error && (
        <div className="upload-status error">
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div className="upload-status success">
          ✅ {success}
        </div>
      )}
    </div>
  );
}

function Recommendations({ user, onSessionExpired }) {
  const { t } = useTranslation();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openInsight, setOpenInsight] = useState(null);
  const [page, setPage] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const JOBS_PER_PAGE = 5;

  const fetchProfile = async () => {
    if (!user || !user.id || !user.token) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else if (res.status === 401 || res.status === 403) {
        // Session expired, trigger auth modal
        if (onSessionExpired) {
          onSessionExpired();
          return;
        }
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchRecs = async () => {
    if (!user || !user.id || !user.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/recommendations?user_id=${user.id}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Session expired, trigger auth modal
          if (onSessionExpired) {
            onSessionExpired();
            return;
          }
        }
        throw new Error(t('auth.error_fetch_recommendations'));
      }
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
    if (user && user.id && user.token) {
      fetchProfile();
      fetchRecs();
    }
    // eslint-disable-next-line
  }, [user]);

  // Check if profile has key job preferences filled
  const hasJobPreferences = profile && (
    isFilled(profile.desired_position) || 
    isFilled(profile.desired_city) || 
    isFilled(profile.desired_format) || 
    isFilled(profile.desired_work_time) || 
    isFilled(profile.industries)
  );
  
  const hasAnyProfileData = profile && (
    isFilled(profile.full_name) ||
    isFilled(profile.email) ||
    isFilled(profile.phone_number) ||
    isFilled(profile.experience) ||
    isFilled(profile.education) ||
    isFilled(profile.skills) ||
    hasJobPreferences
  );

  // Message for empty recommendations - different messages based on profile completeness
  const getEmptyMessage = () => {
    if (profileLoading) {
      return (
        <div className="recommendations-message" style={{
          background: '#f8fafd',
          color: '#666',
          border: '1.5px solid #e0e0e0',
          borderRadius: 16,
          padding: '24px 28px',
          margin: '40px auto',
          maxWidth: 580,
          textAlign: 'center',
          fontSize: '1.1rem',
          fontWeight: 500,
          lineHeight: 1.5,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <span role="img" aria-label="loading" style={{fontSize:'1.8em',marginRight:12,display:'block',marginBottom:8}}>⏳</span>
          {t('recommendations.checking_profile')}
        </div>
      );
    }

    if (!hasAnyProfileData) {
      return (
        <div className="recommendations-message" style={{
          background: '#fff6f6',
          color: '#c94a4a',
          border: '1.5px solid #e57373',
          borderRadius: 16,
          padding: '24px 28px',
          margin: '40px auto',
          maxWidth: 580,
          textAlign: 'center',
          fontSize: '1.1rem',
          fontWeight: 500,
          lineHeight: 1.6,
          boxShadow: '0 4px 20px rgba(231,59,59,0.08)'
        }}>
          <span role="img" aria-label="info" style={{fontSize:'1.8em',marginRight:12,display:'block',marginBottom:8}}>ℹ️</span>
          <div dangerouslySetInnerHTML={{ __html: t('recommendations.no_profile') }} />
        </div>
      );
    }

    if (!hasJobPreferences) {
      return (
        <div className="recommendations-message" style={{
          background: '#fff8e1',
          color: '#f57f17',
          border: '1.5px solid #ffb74d',
          borderRadius: 16,
          padding: '24px 28px',
          margin: '40px auto',
          maxWidth: 580,
          textAlign: 'center',
          fontSize: '1.1rem',
          fontWeight: 500,
          lineHeight: 1.6,
          boxShadow: '0 4px 20px rgba(245,127,23,0.08)'
        }}>
          <span role="img" aria-label="warning" style={{fontSize:'1.8em',marginRight:12,display:'block',marginBottom:8}}>⚠️</span>
          <div dangerouslySetInnerHTML={{ __html: t('recommendations.incomplete_preferences') }} />
        </div>
      );
    }

    // Has profile data and job preferences, but no recommendations
    return (
      <div className="recommendations-message" style={{
        background: '#e8f5e8',
        color: '#2e7d32',
        border: '1.5px solid #4caf50',
        borderRadius: 16,
        padding: '24px 28px',
        margin: '40px auto',
        maxWidth: 580,
        textAlign: 'center',
        fontSize: '1.1rem',
        fontWeight: 500,
        lineHeight: 1.6,
        boxShadow: '0 4px 20px rgba(76,175,80,0.08)'
      }}>
        <span role="img" aria-label="search" style={{fontSize:'1.8em',marginRight:12,display:'block',marginBottom:8}}>🔍</span>
        {t('recommendations.searching')}
      </div>
    );
  };

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
      {(user && user.id && user.token) && (
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '2rem'}}>
          <button 
            onClick={fetchRecs} 
            disabled={loading} 
            className="recommendations-refresh-btn"
            style={{ 
              background: loading ? '#e0f1fa' : 'linear-gradient(135deg, #a084e8 0%, #8b5cf6 100%)', 
              color: loading ? '#bbb' : '#fff', 
              fontWeight: 600, 
              minWidth: 140, 
              borderRadius: 14, 
              fontSize: '1rem', 
              padding: '0.8em 2em', 
              border: 'none', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              transition: 'all 0.3s ease',
              margin: 0,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(160, 132, 232, 0.3)',
              transform: loading ? 'none' : 'translateY(0)'
            }}
          >
            {loading ? t('recommendations.refreshing') : t('common.refresh')}
          </button>
        </div>
      )}
      {(!user || !user.id || !user.token)
        ? <div style={{textAlign:'center',marginTop:40,padding:'2rem',background:'#fff',borderRadius:16,boxShadow:'0 4px 20px rgba(0,0,0,0.05)'}}><h2 style={{fontSize:'1.4rem',color:'#666',fontWeight:500,lineHeight:1.5}}>{t('recommendations.login_required')}</h2></div>
        : <>
            {error && <div style={{color: 'red', marginTop: 10}}>{error}</div>}
            <div className="jobs-list" style={{display:'flex',flexDirection:'column',alignItems:'center',marginTop:24, width:'100%'}}>
              {paginatedJobs.length === 0 && !loading && getEmptyMessage()}
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
                          <button style={insightBtnStyle} title={t('recommendations.ai_insight')} onClick={() => setOpenInsight(openInsight === rec.id ? null : rec.id)}>💡</button>
                        )}
                      </div>
                      {rec.salary && <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#23243a', textAlign: 'left' }}>{t('recommendations.salary')}: {rec.salary}</span>}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="job-description" style={{ flex: 1, overflowY: 'auto', lineHeight: 1.5, padding: '8px 12px', margin: '0.5rem 0', width: '100%', background: '#f8fafd', borderRadius: 8, fontSize: '1.05rem', color: 'var(--text-main)', textAlign: 'left', height: '80px', maxHeight: '80px' }}>
                    {rec.description}
                  </div>

                  {/* Footer */}
                  <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      {/* Channel info */}
                      {rec.channel_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>📢</span>
                          <a
                            href={`https://t.me/${rec.channel_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#1976d2', 
                              fontWeight: 500, 
                              fontSize: '0.9rem', 
                              textDecoration: 'none',
                              borderBottom: '1px solid transparent',
                              transition: 'border-bottom 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.borderBottom = '1px solid #1976d2'}
                            onMouseLeave={(e) => e.target.style.borderBottom = '1px solid transparent'}
                          >
                            @{rec.channel_name}
                          </a>
                        </div>
                      )}
                      {/* Contact info */}
                      {rec.contact_info && rec.contact_info !== `https://t.me/${rec.channel_name}` && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>📞</span>
                          {(/^(https?:\/\/|t\.me\/|tg:)/i.test(rec.contact_info.trim()) ? (
                            <a
                              href={rec.contact_info.trim().startsWith('http') ? rec.contact_info.trim() : (rec.contact_info.trim().startsWith('t.me') ? `https://${rec.contact_info.trim()}` : rec.contact_info.trim())}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2e7d32', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none', wordBreak: 'break-all' }}
                            >
                              {rec.contact_info.length > 30 ? `${rec.contact_info.substring(0, 30)}...` : rec.contact_info}
                            </a>
                          ) : (
                            <span style={{ fontWeight: '500', color: '#2e7d32', fontSize: '0.9rem' }}>{rec.contact_info}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {rec.link && <a className="job-link" href={rec.link} target="_blank" rel="noopener noreferrer">{t('recommendations.details')}</a>}
                  </div>

                  {/* AI Insight Popover */}
                  {openInsight === rec.id && rec.reasons && rec.reasons.length > 0 && (
                    <div style={popoverStyle} onClick={e => e.stopPropagation()}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}><span role="img" aria-label="AI">🤖</span> {t('recommendations.ai_insight')}</h4>
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
                  >{t('common.previous')}</button>
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
                  >{t('common.next')}</button>
                </div>
              )}
            </div>
          </>
      }
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    setAuthModalOpen(false);
    
    // Redirect to the page user was trying to access, or default to profile
    if (redirectAfterAuth) {
      navigate(redirectAfterAuth);
      setRedirectAfterAuth(null);
    } else {
      navigate('/profile');
    }
  };

  const handleSessionExpired = (currentPath = null) => {
    localStorage.removeItem('user');
    setUser(null);
    if (currentPath) {
      setRedirectAfterAuth(currentPath);
    }
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <>
      <header className="app-header">
        <nav className="header-nav-container">
          <div className="header-left">
            <img src="/final-logo.png" alt="LazyJumys Logo" className="logo" />
            <span className="company-name">LazyJumys</span>
            
          </div>
          <div className="header-nav">
            <Link to="/">{t('header.home')}</Link>
            <Link to="/jobs">{t('header.vacancies')}</Link>
            {user && <Link to="/profile">{t('header.profile')}</Link>}
            <Link to="/upload-resume">{t('header.upload_resume')}</Link>
            <Link to="/recommendations">{t('header.recommendations')}</Link>
            <LanguageSwitcher />
            {user ? (
              <button type="button" onClick={handleLogout} className="logout-button">{t('header.logout')}</button>
            ) : (
              <button type="button" onClick={() => setAuthModalOpen(true)} className="login-button">{t('header.login')}</button>
            )}
          </div>
        </nav>
      </header>
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/profile" element={<Profile user={user} onSessionExpired={() => handleSessionExpired('/profile')} />} />
          <Route path="/upload-resume" element={<UploadResume user={user} onSessionExpired={() => handleSessionExpired('/upload-resume')} />} />
          <Route path="/recommendations" element={<Recommendations user={user} onSessionExpired={() => handleSessionExpired('/recommendations')} />} />
        </Routes>
      </main>
      <AuthModal open={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
