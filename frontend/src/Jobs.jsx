import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

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
    <div className="page" style={{ display: 'flex', alignItems: 'flex-start', gap: 40, minHeight: 600 }}>
      {/* Filters Sidebar */}
      <form onSubmit={handleApplyFilters} style={{ minWidth: 260, background: '#f8fafd', borderRadius: 18, padding: 24, boxShadow: '0 2px 16px 0 rgba(59,180,231,0.07)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h3 style={{ marginBottom: 8, color: '#23243a', fontWeight: 700, fontSize: '1.25rem', letterSpacing: 0.2 }}>Filters</h3>
        <div style={{ marginBottom: 2 }}>
          <label style={{ fontWeight: 500 }}>Minimum salary:</label>
          <input type="number" name="salary_min" value={filters.salary_min} onChange={handleFilterChange} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #e0f1fa', padding: '7px 10px', fontSize: '1rem', background: '#fff', color: '#23243a' }} placeholder="e.g. 100000" />
        </div>
        <div style={{ marginBottom: 2 }}>
          <label style={{ fontWeight: 500 }}>Industry:</label>
          <input type="text" name="industry" value={filters.industry} onChange={handleFilterChange} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #e0f1fa', padding: '7px 10px', fontSize: '1rem', background: '#fff', color: '#23243a' }} placeholder="e.g. IT, Marketing" />
        </div>
        <div style={{ marginBottom: 2 }}>
          <label style={{ fontWeight: 500 }}>Job title:</label>
          <input type="text" name="title" value={filters.title} onChange={handleFilterChange} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #e0f1fa', padding: '7px 10px', fontSize: '1rem', background: '#fff', color: '#23243a' }} placeholder="e.g. manager" />
        </div>
        <div style={{ marginBottom: 2 }}>
          <label style={{ fontWeight: 500 }}>Format:</label>
          <select name="format" value={filters.format} onChange={handleFilterChange} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #e0f1fa', padding: '7px 10px', fontSize: '1rem', background: '#fff', color: '#23243a' }}>
            {formatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 2 }}>
          <label style={{ fontWeight: 500 }}>Location:</label>
          <input type="text" name="location" value={filters.location} onChange={handleFilterChange} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #e0f1fa', padding: '7px 10px', fontSize: '1rem', background: '#fff', color: '#23243a' }} placeholder="e.g. Moscow" />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="submit" style={{ flex: 1, background: 'var(--accent-blue)', color: '#fff', fontWeight: 600 }}>Apply</button>
          <button type="button" onClick={handleResetFilters} style={{ flex: 1, background: '#e0f1fa', color: 'var(--primary-blue-dark)', fontWeight: 600, border: '1px solid #e0f1fa' }}>Reset</button>
        </div>
      </form>
      {/* Jobs List + Pagination */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ color: '#23243a', fontWeight: 800, fontSize: '2rem', margin: 0 }}>Vacancies</h2>
          <button onClick={() => fetchJobs()} disabled={loading} style={{ background: 'var(--accent-blue)', color: '#fff', fontWeight: 600, minWidth: 120 }}>{loading ? 'Refreshing...' : 'Refresh Jobs'}</button>
        </div>
        {error && <div style={{ color: '#c94a4a', marginTop: 10 }}>{error}</div>}
        <div className="jobs-list" style={{ marginTop: 0 }}>
          {paginatedJobs.length === 0 && !loading && <div style={{ color: '#888', fontSize: '1.1rem', marginTop: 40 }}>No jobs found.</div>}
          {paginatedJobs.map(job => (
            <div className="job-card" key={job.id} style={{ border: '1.5px solid #e0f1fa', boxShadow: '0 4px 24px rgba(59,180,231,0.10)', borderRadius: 18, padding: '1.5rem 2rem', marginBottom: 10 }}>
              <div className="job-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-blue-dark)', marginBottom: 6 }}>{job.title}
                {job.location && <span className="job-location" style={{ color: 'var(--text-muted)', fontSize: '1rem', marginLeft: 12 }}>{job.location}</span>}
              </div>
              {job.salary && <div className="job-salary" style={{ color: 'var(--primary-blue-dark)', fontWeight: 600, marginTop: 2 }}>Salary: {job.salary}</div>}
              {job.industry && <div className="job-industry" style={{ color: '#6b6b8a', fontSize: '1rem', marginTop: 2 }}>Industry: {job.industry}</div>}
              {job.format && <div className="job-format" style={{ color: '#6b6b8a', fontSize: '1rem', marginTop: 2 }}>Format: {job.format}</div>}
              <div className="job-description" style={{ margin: '1rem 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.05rem', lineHeight: 1.5, maxHeight: '6.5em', overflow: 'hidden', position: 'relative' }}>{job.description}</div>
              {job.created_at && <div className="job-date" style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: 10 }}>Published: {formatRelativeDate(job.created_at)}</div>}
              {job.contact_info && <div className="job-contact" style={{ marginTop: 8, color: 'var(--primary-blue-dark)', fontSize: '1rem' }}>Contact: {job.contact_info}</div>}
            </div>
          ))}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 32 }}>
            <button onClick={() => setPage(p => p - 1)} disabled={!canPrev} style={{ background: canPrev ? 'var(--primary-blue-dark)' : '#e0f1fa', color: canPrev ? '#fff' : '#aaa', fontWeight: 600, minWidth: 100 }}>Previous</button>
            <span style={{ fontWeight: 600, color: '#23243a', fontSize: '1.1rem' }}>{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!canNext} style={{ background: canNext ? 'var(--primary-blue-dark)' : '#e0f1fa', color: canNext ? '#fff' : '#aaa', fontWeight: 600, minWidth: 100 }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Jobs; 