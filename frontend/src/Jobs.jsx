import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

const formatOptions = [
  { value: '', label: 'Any format' },
  { value: 'онлайн', label: 'Online' },
  { value: 'офлайн', label: 'Offline' },
  { value: 'гибрид', label: 'Hybrid' },
];

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    salary_min: '',
    industry: '',
    title: '',
    format: '',
    location: '',
  });

  const fetchJobs = async (customFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (customFilters.salary_min) params.append('salary_min', customFilters.salary_min);
      if (customFilters.industry) params.append('industry', customFilters.industry);
      if (customFilters.title) params.append('title', customFilters.title);
      if (customFilters.format) params.append('format', customFilters.format);
      if (customFilters.location) params.append('location', customFilters.location);
      const url = params.toString()
        ? `${API_URL}/jobs/search?${params.toString()}`
        : `${API_URL}/jobs/search`;
      const res = await fetch(url);
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

  const handleFilterChange = e => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = e => {
    e.preventDefault();
    fetchJobs();
  };

  const handleResetFilters = () => {
    setFilters({ salary_min: '', industry: '', title: '', format: '', location: '' });
    fetchJobs({ salary_min: '', industry: '', title: '', format: '', location: '' });
  };

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
      {/* Фильтры слева */}
      <form onSubmit={handleApplyFilters} style={{ minWidth: 220, background: '#f8f8f8', borderRadius: 12, padding: 18, boxShadow: '0 1px 8px 0 rgba(0,0,0,0.04)' }}>
        <h3 style={{ marginBottom: 12 }}>Фильтры</h3>
        <div style={{ marginBottom: 10 }}>
          <label>Минимальная зарплата:</label>
          <input type="number" name="salary_min" value={filters.salary_min} onChange={handleFilterChange} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Индустрия:</label>
          <input type="text" name="industry" value={filters.industry} onChange={handleFilterChange} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Профессия/Должность:</label>
          <input type="text" name="title" value={filters.title} onChange={handleFilterChange} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Формат:</label>
          <select name="format" value={filters.format} onChange={handleFilterChange} style={{ width: '100%' }}>
            {formatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Локация:</label>
          <input type="text" name="location" value={filters.location} onChange={handleFilterChange} style={{ width: '100%' }} />
        </div>
        <button type="submit" style={{ marginRight: 8 }}>Применить</button>
        <button type="button" onClick={handleResetFilters}>Сбросить</button>
      </form>
      {/* Вакансии справа */}
      <div style={{ flex: 1 }}>
        <h2>Vacancies</h2>
        <button onClick={() => fetchJobs()} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Jobs'}</button>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
        <div className="jobs-list">
          {jobs.length === 0 && !loading && <div>No jobs found.</div>}
          {jobs.map(job => (
            <div className="job-card" key={job.id}>
              <div className="job-title">{job.title}
                {job.location && <span className="job-location">{job.location}</span>}
              </div>
              {job.salary && <div className="job-salary">Salary: {job.salary}</div>}
              {job.industry && <div className="job-industry">Industry: {job.industry}</div>}
              {job.format && <div className="job-format">Format: {job.format}</div>}
              <div className="job-description">{job.description}</div>
              {job.created_at && <div className="job-date">Published: {formatDate(job.created_at)}</div>}
              {job.contact_info && <div className="job-contact">Contact: {job.contact_info}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Jobs; 