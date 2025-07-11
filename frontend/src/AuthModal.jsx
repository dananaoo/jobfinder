import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AuthModal({ open, onClose, onAuthSuccess }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Проверка совпадения паролей при регистрации
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError(t('auth.passwords_mismatch'));
      setLoading(false);
      return;
    }
    
    try {
      if (mode === 'login') {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email || undefined,
            phone: form.phone || undefined,
            password: form.password
          })
        });
        if (!res.ok) throw new Error(t('auth.invalid_login'));
        const data = await res.json();
        onAuthSuccess({ ...data, email: form.email, phone: form.phone });
        onClose();
      } else {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email || undefined,
            phone: form.phone || undefined,
            password: form.password
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || t('auth.registration_error'));
        }
        
        // После успешной регистрации сразу логинимся, чтобы получить токен
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: form.email || undefined,
                phone: form.phone || undefined,
                password: form.password
            })
        });
        if (!loginRes.ok) throw new Error(t('auth.login_after_register_error'));
        
        const loginData = await loginRes.json();
        onAuthSuccess(loginData);
        onClose();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, boxShadow: '0 4px 32px 0 rgba(59,180,231,0.13)',
        padding: '28px 32px', maxWidth: 480, width: '79vw', position: 'relative', color: '#23243a',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <button onClick={onClose} style={{position:'absolute',top:12,right:16,fontSize:22,background:'none',border:'none',cursor:'pointer',color:'#888'}}>×</button>
        <h2 style={{marginBottom:20, textAlign:'center', marginTop: 8}}> {mode === 'login' ? t('auth.login_title') : t('auth.register_title')}</h2>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          {mode === 'register' && (
            <>
              <label style={labelStyle} htmlFor="first_name">{t('auth.first_name')}</label>
              <input name="first_name" id="first_name" placeholder={t('auth.first_name_placeholder')} value={form.first_name} onChange={handleChange} required style={inputStyle} />
              <label style={labelStyle} htmlFor="last_name">{t('auth.last_name')}</label>
              <input name="last_name" id="last_name" placeholder={t('auth.last_name_placeholder')} value={form.last_name} onChange={handleChange} required style={inputStyle} />
            </>
          )}
          <label style={labelStyle} htmlFor="email">Email</label>
          <input name="email" id="email" type="email" placeholder={t('auth.email_placeholder')} value={form.email} onChange={handleChange} style={inputStyle} autoComplete="username" />
          <label style={labelStyle} htmlFor="phone">{t('auth.phone')}</label>
          <input name="phone" id="phone" placeholder={t('auth.phone_placeholder')} value={form.phone} onChange={handleChange} style={inputStyle} autoComplete="tel" />
          <div style={{fontSize:'0.9rem',color:'#888',marginTop:-6,marginBottom:4}}>{t('auth.email_or_phone_note')}</div>
          <label style={labelStyle} htmlFor="password">{t('auth.password')}</label>
          <input name="password" id="password" type="password" placeholder={t('auth.password_placeholder')} value={form.password} onChange={handleChange} required style={inputStyle} autoComplete="current-password" />
          {mode === 'register' && (
            <>
              <label style={labelStyle} htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
              <input name="confirmPassword" id="confirmPassword" type="password" placeholder={t('auth.confirm_password_placeholder')} value={form.confirmPassword} onChange={handleChange} required style={inputStyle} autoComplete="new-password" />
            </>
          )}
          {error && <div style={{color:'#c94a4a',marginTop:4,fontSize:'0.9rem'}}>{error}</div>}
          <button type="submit" disabled={loading} style={{marginTop:12,padding:'12px 20px',borderRadius:10,fontSize:'1rem',fontWeight:600}}>{loading ? t('common.loading') : (mode === 'login' ? t('auth.login_button') : t('auth.register_button'))}</button>
        </form>
        <div style={{marginTop:16, textAlign:'center', fontSize:'0.95rem'}}>
          {mode === 'login' ? (
            <>{t('auth.no_account')} <span style={{color:'#3bb4e7',cursor:'pointer'}} onClick={()=>setMode('register')}>{t('auth.register_button')}</span></>
          ) : (
            <>{t('auth.have_account')} <span style={{color:'#3bb4e7',cursor:'pointer'}} onClick={()=>setMode('login')}>{t('auth.login_button')}</span></>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1.2px solid #e0e0e0',
  fontSize: '0.95rem',
  background: '#fafbff',
  color: '#23243a',
};
const labelStyle = {
  fontWeight: 500,
  marginBottom: 2,
  marginTop: 1,
  color: '#23243a',
  fontSize: '0.95rem',
}; 