import React from 'react';

function Home() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-title">
            Find your dream <span className="landing-title-accent">job</span>
          </h1>
          <div className="landing-subtitle">
            LazyJumys helps you find the best jobs and fill your profile in seconds. Upload your resume, get AI-powered recommendations, and apply in one click.
          </div>
          <form className="landing-search" onSubmit={e => {e.preventDefault(); window.location.href='/jobs';}}>
            <input type="text" placeholder="Job title or company" disabled />
            <button className="landing-search-btn" type="submit">Find Job</button>
          </form>
          <div className="landing-partners">Over 2000+ trusted partners around the world</div>
        </div>
        <img className="landing-hero-img" src="/cv-hero.png" alt="hero" />
      </div>
      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <div className="feature-title">AI-анализ резюме</div>
          <div className="feature-desc">Заполни профиль за 1 клик — мы сами вытащим все нужные данные из PDF.</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💼</div>
          <div className="feature-title">Вакансии из Telegram</div>
          <div className="feature-desc">Актуальные предложения с топовых каналов и ботов — всё в одном месте.</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">✨</div>
          <div className="feature-title">Персональные рекомендации</div>
          <div className="feature-desc">Умные подсказки и подборки — только то, что подходит именно тебе.</div>
        </div>
      </div>
    </div>
  );
}

export default Home; 