import React, { useState, useEffect, useCallback } from 'react';
import Section from './Section.jsx';
import ExperienceList from './ExperienceList.jsx';
import EducationList from './EducationList.jsx';
import SkillsList from './SkillsList.jsx';
import LanguagesList from './LanguagesList.jsx';
import AchievementsList from './AchievementsList.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const isFilled = (val) => {
  if (!val) return false;
  if (typeof val === 'string') return val.trim() && val.trim().toLowerCase() !== 'string';
  if (Array.isArray(val)) return val.length > 0;
  return true;
};

const tryParseJSON = (jsonString, fallback = []) => {
    try {
        const result = JSON.parse(jsonString);
        return Array.isArray(result) ? result : [result];
    } catch {
        return Array.isArray(fallback) ? fallback : [jsonString];
    }
};

function Profile({ user, onSessionExpired }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [openSections, setOpenSections] = useState({});
  const [editSections, setEditSections] = useState({});
  const [formState, setFormState] = useState({});

  const isGuest = !user || !user.token;

  const fetchProfile = useCallback(async () => {
    if (!user || !user.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Session expired, trigger auth modal
          if (onSessionExpired) {
            onSessionExpired();
            return;
          }
        }
        const errText = await res.text();
        throw new Error(`Profile not found: ${errText}`);
      }
      const data = await res.json();
      setProfile(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  const handleEdit = (section) => {
    let currentData;
    
    if (['experience', 'education', 'languages'].includes(section)) {
        // Для объектных списков (работа, образование, языки)
        currentData = profile[section] ? tryParseJSON(profile[section], [{}]) : [{}];
    } else if (['skills', 'achievements'].includes(section)) {
        // Для простых списков (навыки, достижения)
        if (profile[section]) {
            try {
                // Сначала пробуем парсить как JSON (если данные сохранены как массив)
                const parsed = JSON.parse(profile[section]);
                currentData = Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed.toString()];
            } catch {
                // Если не JSON, то парсим как строку с запятыми
                currentData = profile[section].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
            }
        } else {
            currentData = [''];
        }
        if (currentData.length === 0) currentData = [''];
    } else {
        // Для простых форм (personal, preferences)
        currentData = { ...profile };
    }
    
    setFormState(prev => ({ ...prev, [section]: currentData }));
    setEditSections(prev => ({ ...prev, [section]: true }));
    setOpenSections(prev => ({ ...prev, [section]: true }));
  };
  
  const handleCancel = (section) => {
    setEditSections(prev => ({ ...prev, [section]: false }));
    setEditError(null);
  };
  
  const handleSave = async (section) => {
    setEditLoading(true);
    setEditError(null);
    
    let value = formState[section];
    let body;

    if (['skills', 'achievements'].includes(section)) {
        value = value.filter(Boolean).join(', ');
        body = { [section]: value };
    } else if (Array.isArray(value)) {
        value = JSON.stringify(value.filter(item => Object.values(item).some(v => v)));
        body = { [section]: value };
    } else {
        // Для personal и preferences
        body = formState[section];
    }
    
    try {
        const res = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              // Session expired, trigger auth modal
              if (onSessionExpired) {
                onSessionExpired();
                return;
              }
            }
            const errData = await res.json();
            throw new Error(errData.detail || 'Failed to save');
        }
        const data = await res.json();
        setProfile(data);
        handleCancel(section);
    } catch (e) {
        setEditError(e.message);
    } finally {
        setEditLoading(false);
    }
  };

  const handleFormListChange = (section, index, event) => {
    const { name, value } = event.target;
    const newList = [...formState[section]];
    newList[index][name] = value;
    setFormState(prev => ({ ...prev, [section]: newList }));
  };
  
  const handleAddItem = (section) => {
      const newItem = (section === 'skills' || section === 'achievements') ? '' : {};
      setFormState(prev => ({ ...prev, [section]: [...(prev[section] || []), newItem]}));
  };
  
  const handleRemoveItem = (section, index) => {
      setFormState(prev => ({...prev, [section]: prev[section].filter((_, i) => i !== index)}));
  };

  const handleSimpleFormChange = (section, event) => {
    const { name, value } = event.target;
    setFormState(prev => ({
        ...prev,
        [section]: {
            ...prev[section],
            [name]: value
        }
    }));
  };

  if (loading) return <div className="page"><h2>Loading Profile...</h2></div>;
  if (error) return <div className="page"><h2>Error: {error}</h2></div>;
  if (!profile && !isGuest) return <div className="page"><h2>Profile not found.</h2></div>;

  const sections = [
      { 
        id: 'personal', 
        title: 'Personal Information', 
        fields: ['full_name', 'email', 'phone_number', 'address', 'citizenship'] 
      },
      { 
        id: 'preferences', 
        title: 'Job Preferences', 
        fields: ['desired_position', 'desired_city', 'desired_format', 'desired_work_time', 'industries'] 
      },
      { id: 'experience', title: 'Work Experience', Component: ExperienceList },
      { id: 'education', title: 'Education', Component: EducationList },
      { id: 'skills', title: 'Skills', Component: SkillsList },
      { id: 'languages', title: 'Languages', Component: LanguagesList },
      { id: 'achievements', title: 'Achievements', Component: AchievementsList },
  ];

  const renderGenericListForm = (section, placeholder) => {
      const items = formState[section] || [''];
      return (
          <div className="form-container">
              {items.map((item, index) => (
                  <div key={index} className="form-item" style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                      <input
                          value={item}
                          onChange={(e) => {
                              const newList = [...items];
                              newList[index] = e.target.value;
                              setFormState(prev => ({ ...prev, [section]: newList }));
                          }}
                          placeholder={placeholder}
                          style={{
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: '1.2px solid #e0e0e0',
                              fontSize: '1rem',
                              background: '#fafbff',
                              color: '#23243a',
                              flex: 1,
                              marginRight: '10px'
                          }}
                      />
                      <button 
                          onClick={() => handleRemoveItem(section, index)} 
                          className="remove-btn"
                          style={{
                              background: '#d32f2f',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              width: '30px',
                              height: '30px',
                              cursor: 'pointer'
                          }}
                      >✖</button>
                  </div>
              ))}
              <button 
                  onClick={() => handleAddItem(section)}
                  style={{
                      background: '#3a3a3a',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginBottom: '16px'
                  }}
              >+ Add</button>
              <div className="form-actions">
                  <button 
                      onClick={() => handleSave(section)} 
                      disabled={editLoading}
                      style={{
                          background: '#4caf50',
                          color: 'white',
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: editLoading ? 'not-allowed' : 'pointer',
                          marginRight: '10px'
                      }}
                  >Save</button>
                  <button 
                      onClick={() => handleCancel(section)}
                      style={{
                          background: '#d32f2f',
                          color: 'white',
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                      }}
                  >Cancel</button>
              </div>
              {editError && <div className="form-error" style={{color: '#d32f2f', marginTop: '10px'}}>{editError}</div>}
          </div>
      );
  };

  const renderObjectListForm = (section, fields) => {
    const items = formState[section] || [{}];
    return (
        <div className="form-container">
            {items.map((item, index) => (
                <div key={index} className="form-item-wrapper">
                    <div className="form-item-grid">
                        {fields.map(({name, placeholder}) => (
                            <input
                                key={name}
                                name={name}
                                value={item[name] || ''}
                                onChange={(e) => handleFormListChange(section, index, e)}
                                placeholder={placeholder}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: '1.2px solid #e0e0e0',
                                    fontSize: '1rem',
                                    background: '#fafbff',
                                    color: '#23243a',
                                    marginBottom: '8px',
                                    width: '100%'
                                }}
                            />
                        ))}
                    </div>
                    <button onClick={() => handleRemoveItem(section, index)} className="remove-btn">✖</button>
                </div>
            ))}
            <button 
                onClick={() => handleAddItem(section)}
                style={{
                    background: '#3a3a3a',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '16px'
                }}
            >+ Add</button>
            <div className="form-actions">
                <button 
                    onClick={() => handleSave(section)} 
                    disabled={editLoading}
                    style={{
                        background: '#4caf50',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: editLoading ? 'not-allowed' : 'pointer',
                        marginRight: '10px'
                    }}
                >Save</button>
                <button 
                    onClick={() => handleCancel(section)}
                    style={{
                        background: '#d32f2f',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >Cancel</button>
            </div>
            {editError && <div className="form-error" style={{color: '#d32f2f', marginTop: '10px'}}>{editError}</div>}
        </div>
    );
  }

  const renderSimpleForm = (section, fields) => {
      const currentFormState = formState[section] || {};
      return (
        <div className="form-container">
             {fields.map(({name, placeholder}) => (
                <div key={name} className="form-row" style={{marginBottom: '16px'}}>
                    <label style={{display: 'block', marginBottom: '4px', fontWeight: '600'}}>{placeholder}</label>
                    <input
                        name={name}
                        value={currentFormState[name] || ''}
                        onChange={(e) => handleSimpleFormChange(section, e)}
                        placeholder={placeholder}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1.2px solid #e0e0e0',
                            fontSize: '1rem',
                            background: '#fafbff',
                            color: '#23243a',
                            width: '100%'
                        }}
                    />
                </div>
            ))}
            <div className="form-actions">
                <button 
                    onClick={() => handleSave(section)} 
                    disabled={editLoading}
                    style={{
                        background: '#4caf50',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: editLoading ? 'not-allowed' : 'pointer',
                        marginRight: '10px'
                    }}
                >Save</button>
                <button 
                    onClick={() => handleCancel(section)}
                    style={{
                        background: '#d32f2f',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >Cancel</button>
            </div>
            {editError && <div className="form-error" style={{color: '#d32f2f', marginTop: '10px'}}>{editError}</div>}
        </div>
      );
  }

  const renderSimpleData = (section, fields) => {
      return (
          <div className="simple-data-grid">
              {fields.map(({name, placeholder}) => (
                  <div key={name}>
                      <b>{placeholder}:</b> {profile[name] || <span className="not-filled">Not filled</span>}
                  </div>
              ))}
          </div>
      );
  }

  return (
    <div className="page">
      {isGuest ? (
        <div style={{textAlign:'center', color:'#c94a4a', marginTop: 40, fontWeight:600, fontSize:'1.2rem'}}>Please log in to view your profile.</div>
      ) : (
        <>
          <h2>User Profile{profile && profile.full_name ? `: ${profile.full_name}` : user && user.email ? `: ${user.email}` : ''}</h2>
          <div className="profile-accordion">
            {sections.map(({ id, title, Component, fields }) => {
          let progressPercent = 0;
          if (fields) {
            const total = fields.length;
            const filledCount = profile ? fields.filter(field => isFilled(profile[field])).length : 0;
            progressPercent = Math.round((filledCount / total) * 100);
          } else {
            progressPercent = profile && isFilled(profile[id]) ? 100 : 0;
          }
          return (
            <Section
              key={id}
              title={title}
              filled={progressPercent === 100}
              progressPercent={progressPercent}
              open={openSections[id]}
              isEditing={editSections[id]}
              onClick={isGuest ? undefined : () => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))}
              onEdit={isGuest ? undefined : () => handleEdit(id)}
            >
              {isGuest ? (
                <div style={{color:'#aaa',fontStyle:'italic',padding:'12px 0'}}>Log in to view and edit this section.</div>
              ) : editSections[id]
                ? (
                    id === 'personal' ? renderSimpleForm('personal', [
                        {name: 'full_name', placeholder: 'Full Name'},
                        {name: 'email', placeholder: 'Email'},
                        {name: 'phone_number', placeholder: 'Phone'},
                        {name: 'address', placeholder: 'Address'},
                        {name: 'citizenship', placeholder: 'Citizenship'},
                    ]) :
                    id === 'preferences' ? renderSimpleForm('preferences', [
                        {name: 'desired_position', placeholder: 'Desired Position'},
                        {name: 'desired_city', placeholder: 'Desired City'},
                        {name: 'desired_format', placeholder: 'Work Format'},
                        {name: 'desired_work_time', placeholder: 'Work Schedule'},
                        {name: 'industries', placeholder: 'Industries'},
                    ]) :
                    id === 'experience' ? renderObjectListForm('experience', [
                        {name: 'title', placeholder: 'Position'},
                        {name: 'company', placeholder: 'Company'},
                        {name: 'start_date', placeholder: 'Start Date'},
                        {name: 'end_date', placeholder: 'End Date'},
                    ]) :
                    id === 'education' ? renderObjectListForm('education', [
                        {name: 'university', placeholder: 'University'},
                        {name: 'degree', placeholder: 'Degree'},
                        {name: 'start_date', placeholder: 'Start Date'},
                        {name: 'end_date', placeholder: 'End Date'},
                    ]) :
                    id === 'languages' ? renderObjectListForm('languages', [
                        {name: 'language', placeholder: 'Language'},
                        {name: 'level', placeholder: 'Level'},
                    ]) :
                    id === 'skills' ? renderGenericListForm('skills', 'Skill') :
                    id === 'achievements' ? renderGenericListForm('achievements', 'Achievement') :
                    null
                  )
                : (
                    id === 'personal' ? renderSimpleData('personal', [
                        {name: 'full_name', placeholder: 'Full Name'},
                        {name: 'email', placeholder: 'Email'},
                        {name: 'phone_number', placeholder: 'Phone'},
                        {name: 'address', placeholder: 'Address'},
                        {name: 'citizenship', placeholder: 'Citizenship'},
                    ]) :
                    id === 'preferences' ? renderSimpleData('preferences', [
                        {name: 'desired_position', placeholder: 'Desired Position'},
                        {name: 'desired_city', placeholder: 'Desired City'},
                        {name: 'desired_format', placeholder: 'Work Format'},
                        {name: 'desired_work_time', placeholder: 'Work Schedule'},
                        {name: 'industries', placeholder: 'Industries'},
                    ]) :
                    (profile && profile[id] && Component ? <Component {...{ [id]: profile[id] }} /> : <span className="not-filled">Not filled</span>)
                  )
              }
              </Section>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}

export default Profile; 