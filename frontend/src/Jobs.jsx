import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// formatRelativeDate moved inside component to access t()

// formatOptions будет создан внутри компонента для доступа к t()

const JOBS_PER_PAGE = 5;

function Jobs() {
  const { t } = useTranslation();
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

  const formatOptions = [
    { value: '', label: t('jobs.format_any') },
    { value: 'online', label: t('jobs.format_online') },
    { value: 'offline', label: t('jobs.format_offline') },
    { value: 'hybrid', label: t('jobs.format_hybrid') },
  ];

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return t('jobs.just_now');
    if (diffMin < 60) {
      const s = diffMin === 1 ? '' : 's';
      return t('jobs.minutes_ago', { count: diffMin, s });
    }
    if (diffHour < 24) {
      const s = diffHour === 1 ? '' : 's';
      return t('jobs.hours_ago', { count: diffHour, s });
    }
    if (diffDay < 7) {
      const s = diffDay === 1 ? '' : 's';
      return t('jobs.days_ago', { count: diffDay, s });
    }
    // If more than a week, show date
    return date.toLocaleDateString();
  };

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
      // Проверяем есть ли фильтры
      const hasFilters = params.toString().length > 0;
      
      const url = hasFilters
        ? `${API_URL}/jobs/search?${params.toString()}`
        : `${API_URL}/jobs`; // Используем /jobs для всех вакансий без фильтров
      const res = await fetch(url);
              if (!res.ok) throw new Error(t('auth.error_fetch_jobs'));
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

  // Функции для пагинации со скроллом наверх
  const handlePrevPage = () => {
    setPage(page - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setPage(page + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page jobs-page-container">
      {/* Page Title - должен быть первым */}
      <div className="jobs-page-header">
        <h1 className="vacancies-title">{t('jobs.title')}</h1>
      </div>

      {/* Filters Sidebar */}
      <form onSubmit={handleApplyFilters} className="jobs-filters-sidebar">
        <h3 className="jobs-filters-title">{t('jobs.filters_title')}</h3>
        <div className="jobs-filter-group">
          <label className="jobs-filter-label">{t('jobs.salary_min')}:</label>
          <input 
            type="number" 
            name="salary_min" 
            value={filters.salary_min} 
            onChange={handleFilterChange} 
            className="jobs-filter-input" 
            placeholder={t('jobs.placeholder_salary')} 
          />
        </div>
        <div className="jobs-filter-group">
          <label className="jobs-filter-label">{t('jobs.industry')}:</label>
          <input 
            type="text" 
            name="industry" 
            value={filters.industry} 
            onChange={handleFilterChange} 
            className="jobs-filter-input" 
            placeholder={t('jobs.placeholder_industry')} 
          />
        </div>
        <div className="jobs-filter-group">
          <label className="jobs-filter-label">{t('jobs.job_title')}:</label>
          <input 
            type="text" 
            name="title" 
            value={filters.title} 
            onChange={handleFilterChange} 
            className="jobs-filter-input" 
            placeholder={t('jobs.placeholder_job_title')} 
          />
        </div>
        <div className="jobs-filter-group">
          <label className="jobs-filter-label">{t('jobs.format')}:</label>
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
          <label className="jobs-filter-label">{t('jobs.location')}:</label>
          <input 
            type="text" 
            name="location" 
            value={filters.location} 
            onChange={handleFilterChange} 
            className="jobs-filter-input" 
            placeholder={t('jobs.placeholder_location')} 
          />
        </div>
        <div className="jobs-filter-buttons">
          <button type="submit" className="jobs-filter-button jobs-filter-apply">{t('jobs.filter_apply')}</button>
          <button type="button" onClick={handleResetFilters} className="jobs-filter-button jobs-filter-reset">{t('jobs.filter_reset')}</button>
        </div>
      </form>

      {/* Jobs List + Pagination */}
      <div className="jobs-main-content">
        <div className="main-content">
          <div className="header-row">
            <h1 className="vacancies-title desktop-only">{t('jobs.title')}</h1>
            <button 
              onClick={() => fetchJobs()} 
              disabled={loading} 
              className={`refresh-btn ${loading ? 'refresh-btn-loading' : 'refresh-btn-active'}`}
            >
              {loading ? t('jobs.loading') : t('common.refresh')}
            </button>
          </div>
          {error && <div className="jobs-error-message">{error}</div>}
          <div className="jobs-list">
            {paginatedJobs.length === 0 && !loading && <div className="jobs-empty-message">{t('jobs.no_jobs')}</div>}
            {paginatedJobs.map(job => (
              <div className="job-card" key={job.id}>
                <div className="job-title">
                  {job.title}
                  {job.location && <span className="job-location">{job.location}</span>}
                </div>
                {job.salary && <div className="job-salary">{t('jobs.salary_label')}: {job.salary}</div>}
                {job.industry && <div className="job-industry">{t('jobs.industry_label')}: {job.industry}</div>}
                {job.format && <div className="job-format">{t('jobs.format_label')}: {job.format}</div>}
                <div className="job-description">{job.description}</div>
                {job.created_at && <div className="job-date">{t('jobs.published')}: {formatRelativeDate(job.created_at)}</div>}
                {job.contact_info && (
                  <div className="job-contact">
                    {t('jobs.contact')}: {/^(https?:\/\/|t\.me\/|tg:)/i.test(job.contact_info.trim()) ? (
                      <a
                        href={job.contact_info.trim().startsWith('http') ? job.contact_info.trim() : (job.contact_info.trim().startsWith('t.me') ? `https://${job.contact_info.trim()}` : job.contact_info.trim())}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="job-link"
                      >
                        {job.contact_info}
                      </a>
                    ) : (
                      <span className="job-contact-text">{job.contact_info}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                onClick={handlePrevPage}
                disabled={!canPrev}
                className={`pagination-btn ${canPrev ? 'pagination-btn-active' : 'pagination-btn-disabled'}`}
              >{t('common.pagination_previous')}</button>
              <span className="pagination-info">{page+1}/{totalPages}</span>
              <button
                onClick={handleNextPage}
                disabled={!canNext}
                className={`pagination-btn ${canNext ? 'pagination-btn-active' : 'pagination-btn-disabled'}`}
              >{t('common.pagination_next')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Jobs; 