import React from 'react';
import { useTranslation } from 'react-i18next';

function Home() {
  const { t } = useTranslation();
  
  return (
    <div className="landing">
      {/* Main White Block Container */}
      <div className="landing-hero-container">
        {/* Hero Section */}
        <div className="landing-hero">
          <div className="landing-hero-content">
            <h1 className="landing-title" dangerouslySetInnerHTML={{ __html: t('home.hero_title') }}>
            </h1>
            <div className="landing-subtitle">
              {t('home.hero_subtitle')}
            </div>
            <div className="landing-cta-buttons">
              <button className="landing-cta-primary" onClick={() => window.location.href='/recommendations'}>
                {t('home.cta_primary')}
              </button>
              <button className="landing-cta-secondary" onClick={() => window.location.href='/jobs'}>
                {t('home.cta_secondary')}
              </button>
            </div>
            <div className="landing-partners">{t('home.free_text')}</div>
          </div>
          <img className="landing-hero-img" src="/cv-hero.png" alt="LazyJumys Hero" />
        </div>

        {/* How It Works Section */}
        <div className="how-it-works-section">
          <h2 className="section-title">{t('home.how_it_works')}</h2>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🔍</div>
              <div className="step-title">We scan top Telegram channels</div>
              <div className="step-desc">Continuously monitoring the best job channels for new opportunities</div>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">🎯</div>
              <div className="step-title">Filter by your interests and experience</div>
              <div className="step-desc">AI matches jobs based on your skills, location, and preferences</div>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">✨</div>
              <div className="step-title">Show only the most relevant vacancies</div>
              <div className="step-desc">Get personalized job recommendations that actually fit your profile</div>
            </div>
          </div>
        </div>

        {/* Why LazyJumys Section */}
        <div className="why-section">
          <h2 className="section-title">{t('home.why_section')}</h2>
          <div className="landing-features">
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <div className="feature-title">Automatic Filtering</div>
              <div className="feature-desc">No more scrolling through irrelevant job posts. We filter everything for you.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <div className="feature-title">AI Support</div>
              <div className="feature-desc">Smart profile filling, contact extraction, and job matching powered by AI.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <div className="feature-title">Works Offline</div>
              <div className="feature-desc">Get job updates even when you're not online. We work 24/7 for you.</div>
            </div>
          </div>
        </div>

        {/* How to Use Section */}
        <div className="how-to-use-section">
          <h2 className="section-title">{t('home.how_to_use')}</h2>
          <div className="use-steps-container">
            <div className="use-step">
              <div className="use-step-image-placeholder">
                <img src="/login.png" alt="Create Account" className="use-step-image" />
              </div>
              <div className="use-step-content">
                <h3 className="use-step-title">{t('home.step1_title')}</h3>
                <p className="use-step-desc">{t('home.step1_desc')}</p>
                <button className="use-step-btn" onClick={() => window.location.href='/register'}>
                  {t('home.step1_button')}
                </button>
              </div>
            </div>

            <div className="use-step reverse">
              <div className="use-step-content">
                <h3 className="use-step-title">{t('home.step2_title')}</h3>
                <p className="use-step-desc">{t('home.step2_desc')}</p>
                <button className="use-step-btn" onClick={() => window.location.href='/upload-resume'}>
                  {t('home.step2_button')}
                </button>
              </div>
              <div className="use-step-image-placeholder">
                <img src="/resume.png" alt="Upload Resume" className="use-step-image" />
              </div>
            </div>

            <div className="use-step">
              <div className="use-step-image-placeholder">
                <img src="/profile.png" alt="Complete Profile" className="use-step-image" />
              </div>
              <div className="use-step-content">
                <h3 className="use-step-title">{t('home.step3_title')}</h3>
                <p className="use-step-desc">{t('home.step3_desc')}</p>
                <button className="use-step-btn" onClick={() => window.location.href='/profile'}>
                  {t('home.step3_button')}
                </button>
              </div>
            </div>

            <div className="use-step reverse">
              <div className="use-step-content">
                <h3 className="use-step-title">{t('home.step4_title')}</h3>
                <p className="use-step-desc">{t('home.step4_desc')}</p>
                <button className="use-step-btn" onClick={() => window.location.href='/recommendations'}>
                  {t('home.step4_button')}
                </button>
              </div>
              <div className="use-step-image-placeholder">
                <img src="/recommendation.png" alt="Get Recommendations" className="use-step-image" />
              </div>
            </div>

            <div className="use-step-alternative">
              <div className="alternative-content-with-image">
                <div className="alternative-image">
                  <img src="/vacancies.png" alt="Browse All Jobs" className="alternative-img" />
                </div>
                <div className="alternative-content">
                  <h3 className="alternative-title">Or Browse Jobs Without Registration</h3>
                  <p className="alternative-desc">Not ready to sign up? You can still browse all available vacancies without creating an account.</p>
                  <button className="alternative-btn" onClick={() => window.location.href='/jobs'}>
                    Browse All Jobs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Home; 