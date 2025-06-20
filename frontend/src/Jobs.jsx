import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
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

export default Jobs; 