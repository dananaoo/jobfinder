import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ResumeLibrary({ user }) {
  const { t } = useTranslation();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchResumes = async () => {
      try {
        const res = await fetch(`${API_URL}/resumes?telegram_id=${user.telegram_id}`); // Предполагаем такой эндпоинт
        if (!res.ok) throw new Error(t('resume_library.error_fetch'));
        const data = await res.json();
        setResumes(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, [user]);

  const handleCreateResume = async () => {
    const title = prompt('Please enter a title for the new resume:', 'My New Resume');
    if (title) {
      try {
        const res = await fetch(`${API_URL}/resumes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, telegram_id: user.telegram_id }),
        });
        if (!res.ok) throw new Error(t('resume_library.error_create'));
        const newResume = await res.json();
        navigate(`/profile/${newResume.id}`);
      } catch (e) {
        setError(e.message);
      }
    }
  };

  if (loading) return <div className="page">{t('resume_library.loading')}</div>;
  if (error) return <div className="page" style={{color: 'red'}}>{error}</div>;

  return (
    <div className="page">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>{t('resume_library.title')}</h2>
        <button onClick={handleCreateResume} style={{background: '#2e7d32', color: '#fff'}}>+ {t('resume_library.create_new')}</button>
      </div>
      <div className="resume-library-grid">
        {resumes.map(resume => (
          <div key={resume.id} className="resume-card">
            <h3>{resume.title || t('resume_library.untitled')}</h3>
            <p>{t('resume_library.last_updated')}: {new Date(resume.updated_at).toLocaleDateString()}</p>
            <Link to={`/profile/${resume.id}`} className="view-resume-link">{t('resume_library.view_edit')}</Link>
          </div>
        ))}
        {resumes.length === 0 && <p>{t('resume_library.no_resumes')}</p>}
      </div>
    </div>
  );
}

export default ResumeLibrary; 