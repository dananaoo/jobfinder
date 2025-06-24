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
    } catch (e) {
        return Array.isArray(fallback) ? fallback : [jsonString];
    }
};

function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [openSections, setOpenSections] = useState({});
  const [editSections, setEditSections] = useState({});
  const [formState, setFormState] = useState({});

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
  
  const handleToggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleEdit = (section) => {
    let currentData = profile[section];
    if (['experience', 'education', 'languages'].includes(section)) {
        currentData = currentData ? tryParseJSON(currentData, [{}]) : [{}];
    } else if (['skills', 'achievements'].includes(section)) {
        currentData = currentData ? currentData.split(',').map(s => s.trim()) : [''];
    } else {
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

  if (!user) return <div className="page" style={{textAlign:'center'}}><h2>Please log in to view your profile.</h2></div>;
  if (loading) return <div className="page"><h2>Loading Profile...</h2></div>;
  if (error) return <div className="page"><h2>Error: {error}</h2></div>;
  if (!profile) return <div className="page"><h2>Profile not found.</h2></div>;

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
                  <div key={index} className="form-item">
                      <input
                          value={item}
                          onChange={(e) => {
                              const newList = [...items];
                              newList[index] = e.target.value;
                              setFormState(prev => ({ ...prev, [section]: newList }));
                          }}
                          placeholder={placeholder}
                      />
                      <button onClick={() => handleRemoveItem(section, index)} className="remove-btn">✖</button>
                  </div>
              ))}
              <button onClick={() => handleAddItem(section)}>+ Add</button>
              <div className="form-actions">
                  <button onClick={() => handleSave(section)} disabled={editLoading}>Save</button>
                  <button onClick={() => handleCancel(section)}>Cancel</button>
              </div>
              {editError && <div className="form-error">{editError}</div>}
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
                            />
                        ))}
                    </div>
                    <button onClick={() => handleRemoveItem(section, index)} className="remove-btn">✖</button>
                </div>
            ))}
            <button onClick={() => handleAddItem(section)}>+ Add</button>
            <div className="form-actions">
                <button onClick={() => handleSave(section)} disabled={editLoading}>Save</button>
                <button onClick={() => handleCancel(section)}>Cancel</button>
            </div>
            {editError && <div className="form-error">{editError}</div>}
        </div>
    );
  }

  const renderSimpleForm = (section, fields) => {
      const currentFormState = formState[section] || {};
      return (
        <div className="form-container">
             {fields.map(({name, placeholder}) => (
                <div key={name} className="form-row">
                    <label>{placeholder}</label>
                    <input
                        name={name}
                        value={currentFormState[name] || ''}
                        onChange={(e) => handleSimpleFormChange(section, e)}
                        placeholder={placeholder}
                    />
                </div>
            ))}
            <div className="form-actions">
                <button onClick={() => handleSave(section)} disabled={editLoading}>Save</button>
                <button onClick={() => handleCancel(section)}>Cancel</button>
            </div>
            {editError && <div className="form-error">{editError}</div>}
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
      <h2>User Profile: {profile.full_name || user.email}</h2>
       <div className="profile-accordion">
        {sections.map(({ id, title, Component, fields }) => (
            <Section
                key={id}
                title={title}
                filled={fields ? fields.some(field => isFilled(profile[field])) : isFilled(profile[id])}
                open={openSections[id]}
                isEditing={editSections[id]}
                onClick={() => handleToggleSection(id)}
                onEdit={() => handleEdit(id)}
            >
                {editSections[id]
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
                        (profile[id] ? <Component {...{ [id]: profile[id] }} /> : <span className="not-filled">Not filled</span>)
                    )
                }
            </Section>
        ))}
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

export default Profile; 