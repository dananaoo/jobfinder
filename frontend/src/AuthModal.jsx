import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AuthModal({ open, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
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
        if (!res.ok) throw new Error('Неверный логин или пароль');
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
          throw new Error(err.detail || 'Ошибка регистрации');
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
        if (!loginRes.ok) throw new Error('Не удалось войти после регистрации');
        
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
        padding: '32px 28px', minWidth: 340, maxWidth: 380, width: '100%', position: 'relative', color: '#23243a'
      }}>
        <button onClick={onClose} style={{position:'absolute',top:12,right:16,fontSize:22,background:'none',border:'none',cursor:'pointer',color:'#888'}}>×</button>
        <h2 style={{marginBottom:18, textAlign:'center'}}> {mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          {mode === 'register' && (
            <>
              <label style={labelStyle} htmlFor="first_name">Имя</label>
              <input name="first_name" id="first_name" placeholder="Введите имя" value={form.first_name} onChange={handleChange} required style={inputStyle} />
              <label style={labelStyle} htmlFor="last_name">Фамилия</label>
              <input name="last_name" id="last_name" placeholder="Введите фамилию" value={form.last_name} onChange={handleChange} required style={inputStyle} />
            </>
          )}
          <label style={labelStyle} htmlFor="email">Email</label>
          <input name="email" id="email" type="email" placeholder="Введите email (необязательно)" value={form.email} onChange={handleChange} style={inputStyle} autoComplete="username" />
          <label style={labelStyle} htmlFor="phone">Телефон</label>
          <input name="phone" id="phone" placeholder="Введите телефон (необязательно)" value={form.phone} onChange={handleChange} style={inputStyle} autoComplete="tel" />
          <div style={{fontSize:'0.97rem',color:'#888',marginTop:-8,marginBottom:2}}>Можно ввести <b>либо email, либо телефон</b></div>
          <label style={labelStyle} htmlFor="password">Пароль</label>
          <input name="password" id="password" type="password" placeholder="Введите пароль" value={form.password} onChange={handleChange} required style={inputStyle} autoComplete="current-password" />
          {error && <div style={{color:'#c94a4a',marginTop:2}}>{error}</div>}
          <button type="submit" disabled={loading} style={{marginTop:8}}>{loading ? 'Загрузка...' : (mode === 'login' ? 'Войти' : 'Зарегистрироваться')}</button>
        </form>
        <div style={{marginTop:18, textAlign:'center', fontSize:'0.98rem'}}>
          {mode === 'login' ? (
            <>Нет аккаунта? <span style={{color:'#3bb4e7',cursor:'pointer'}} onClick={()=>setMode('register')}>Зарегистрироваться</span></>
          ) : (
            <>Уже есть аккаунт? <span style={{color:'#3bb4e7',cursor:'pointer'}} onClick={()=>setMode('login')}>Войти</span></>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1.2px solid #e0e0e0',
  fontSize: '1rem',
  background: '#fafbff',
  color: '#23243a',
};
const labelStyle = {
  fontWeight: 500,
  marginBottom: 2,
  marginTop: 2,
  color: '#23243a',
  fontSize: '1rem',
}; 