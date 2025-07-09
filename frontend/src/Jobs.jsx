import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  // If more than a week, show date
  return date.toLocaleDateString();
}

const formatOptions = [
  { value: '', label: 'Any format' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
];

const JOBS_PER_PAGE = 5;

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
  const [page, setPage] = useState(0);

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
      setPage(0); // Reset to first page on new search
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = e => {
    e.preventDefault();
    fetchJobs();
  };

  const handleResetFilters = () => {
    setFilters({ salary_min: '', industry: '', title: '', format: '', location: '' });
    fetchJobs({ salary_min: '', industry: '', title: '', format: '', location: '' });
  };

  // Pagination logic
  const totalPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
  const paginatedJobs = jobs.slice(page * JOBS_PER_PAGE, (page + 1) * JOBS_PER_PAGE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="page jobs-page-container">
      {/* Page Title - должен быть первым */}
      <div className="jobs-page-header">
        <h1 className="vacancies-title">Vacancies</h1>
      </div>

      {/* Filters Sidebar */}
      <form onSubmit={handleApplyFilters} className="jobs-filters-sidebar">
        <h3 className="jobs-filters-title">Filters</h3>
        <div className="jobs-filter-group">
          <label className="jobs-filter-label">Minimum salary:</label>
          <input 
            type="number" 
            name="salary_min" 
            value={filters.salary_min} 
            onChange={handleFilterChange} 
            className="jobs-filter-input" 
            placeholder="e.g. 100000" 
          />
        </div>
        <div className="jobs-filter-group">
          <label className="jobs-filter-label">Industry:</label>
          <input 
            type="text" 
            name="industry" 
            value={filters.industry} 
            onChange={handleFilterChange} 
            className="jobs-filter-input" 
            placeholder="e.g. IT, Marketing" 
          />
        </div>
        <div className="jobs-filter-group">
          <label className="jobs-filter-label">Job title:</label>
          <input 
            type="text" 
            name="title" 
            value={filters.title} 
            onChange={handleFilterChange} 
            className="jobs-filter-input" 
            placeholder="e.g. manager" 
          />
        </div>
        <div className="jobs-filter-group">
          <label className="jobs-filter-label">Format:</label>
          <select 
            name="format" 
            value={filters.format} 
            onChange={handleFilterChange} 
            className="jobs-filter-input"
          >
            {formatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="jobs-filter-group">
          <label className="jobs-filter-label">Location:</label>
          <input 
            type="text" 
            name="location" 
            value={filters.location} 
            onChange={handleFilterChange} 
            className="jobs-filter-input" 
            placeholder="e.g. Moscow" 
          />
        </div>
        <div className="jobs-filter-buttons">
          <button type="submit" className="jobs-filter-button jobs-filter-apply">Apply</button>
          <button type="button" onClick={handleResetFilters} className="jobs-filter-button jobs-filter-reset">Reset</button>
        </div>
      </form>

      {/* Jobs List + Pagination */}
      <div className="jobs-main-content">
        <div className="main-content">
          <div className="header-row">
            <h1 className="vacancies-title desktop-only">Vacancies</h1>
            <button 
              onClick={() => fetchJobs()} 
              disabled={loading} 
              className="refresh-btn"
              style={{ 
                background: loading ? '#e0f1fa' : '#a084e8', 
                color: loading ? '#bbb' : '#fff', 
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {error && <div style={{ color: '#c94a4a', marginTop: 10 }}>{error}</div>}
          <div className="jobs-list" style={{ marginTop: 0 }}>
            {paginatedJobs.length === 0 && !loading && <div style={{ color: '#888', fontSize: '1.1rem', marginTop: 40 }}>No jobs found.</div>}
            {paginatedJobs.map(job => (
              <div className="job-card" key={job.id}>
                <div className="job-title">
                  {job.title}
                  {job.location && <span className="job-location">{job.location}</span>}
                </div>
                {job.salary && <div className="job-salary">Salary: {job.salary}</div>}
                {job.industry && <div style={{ color: '#6b6b8a', fontSize: '1rem', marginTop: 2, textAlign: 'left' }}>Industry: {job.industry}</div>}
                {job.format && <div style={{ color: '#6b6b8a', fontSize: '1rem', marginTop: 2, textAlign: 'left' }}>Format: {job.format}</div>}
                <div className="job-description" style={{ margin: '1rem 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.05rem', lineHeight: 1.5, height: '80px', maxHeight: '80px', overflowY: 'auto', width: '100%', background: '#f8fafd', borderRadius: 8, padding: '8px 12px', textAlign: 'left' }}>{job.description}</div>
                {job.created_at && <div className="job-date">Published: {formatRelativeDate(job.created_at)}</div>}
                {job.contact_info && (
                  <div style={{ marginTop: 8, fontSize: '1rem', textAlign: 'left' }}>
                    Contact: {/^(https?:\/\/|t\.me\/|tg:)/i.test(job.contact_info.trim()) ? (
                      <a
                        href={job.contact_info.trim().startsWith('http') ? job.contact_info.trim() : (job.contact_info.trim().startsWith('t.me') ? `https://${job.contact_info.trim()}` : job.contact_info.trim())}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="job-link"
                      >
                        {job.contact_info}
                      </a>
                    ) : (
                      <span style={{ color: '#2e7d32', fontWeight: 500 }}>{job.contact_info}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 32 }}>
              <button
                onClick={() => setPage(page-1)}
                disabled={!canPrev}
                style={{
                  background: canPrev ? '#a084e8' : '#e0f1fa',
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
                  background: canNext ? '#a084e8' : '#e0f1fa',
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
      </div>
    </div>
  );
}

export default Jobs; 