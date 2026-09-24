import { useState, useEffect } from 'react';
import { MdEngineering, MdPhone, MdAdd, MdEdit, MdDelete, MdClose, MdSave, MdSearch } from 'react-icons/md';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import '../payment/PaymentDashboard.css';
import './Complaints.css';

function TechniciansList() {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [formData, setFormData] = useState({ name: '', contactInformation: '', skills: '', status: 'Available' });
  const [availableSkills, setAvailableSkills] = useState(['Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'General', 'Appliances', 'Painting']);
  const [newSkill, setNewSkill] = useState('');

  const fetchTechs = () => {
    setLoading(true);
    fetch('http://localhost:5073/api/technicians')
      .then(res => res.json())
      .then(data => {
        setTechs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTechs();
  }, []);

  const openAddModal = () => {
    setEditingTech(null);
    setFormData({ name: '', contactInformation: '', skills: '', status: 'Available' });
    setShowModal(true);
  };

  const openEditModal = (tech) => {
    setEditingTech(tech);
    setFormData({ 
      name: tech.name, 
      contactInformation: tech.contactInformation, 
      skills: tech.skills, 
      status: tech.status 
    });
    
    // Add any custom skills they have to the available list
    if (tech.skills) {
      const currentSkills = tech.skills.split(',').map(s => s.trim()).filter(s => s);
      setAvailableSkills(prev => {
        const updated = [...prev];
        currentSkills.forEach(s => {
          if (!updated.includes(s)) updated.push(s);
        });
        return updated;
      });
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this technician?')) return;
    try {
      await fetch(`http://localhost:5073/api/technicians/${id}`, { method: 'DELETE' });
      fetchTechs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.skills || !formData.contactInformation) {
      alert("Please fill in all fields.");
      return;
    }

    const contactRegex = /^\d{10}$/;
    if (!contactRegex.test(formData.contactInformation.replace(/\s+/g, ''))) {
      alert("Contact number must be exactly 10 digits.");
      return;
    }

    // Clean up whitespace before saving
    const payload = {
      ...formData,
      contactInformation: formData.contactInformation.replace(/\s+/g, '')
    };

    try {
      if (editingTech) {
        // Update
        await fetch(`http://localhost:5073/api/technicians/${editingTech.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingTech.id })
        });
      } else {
        // Create
        await fetch('http://localhost:5073/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      fetchTechs();
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const filteredTechs = techs.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.skills.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <main className="payment-content">
        <header className="payment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="page-label">MANAGEMENT</p>
            <h1>Technicians Directory</h1>
            <p className="page-description">View skills, availability, and active workload.</p>
          </div>
          <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', border: 'none', borderRadius: '50px', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'}>
            <MdAdd size={20} /> Add Technician
          </button>
        </header>

        {/* Search */}
        <div style={{ marginBottom: '20px' }}>
          <div className="search-pill" style={{ maxWidth: '400px' }}>
            <MdSearch className="search-pill-icon" />
            <input
              type="text"
              placeholder="Search technicians by name or skill..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-pill-input"
            />
          </div>
        </div>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Team Roster</h2>
            </div>
          </div>

          {filteredTechs.length === 0 && !loading ? (
            <div className="empty-state" style={{ padding: '60px 20px', borderTop: '1px solid #e3e7e3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MdEngineering size={48} color="#cbd5e0" style={{ marginBottom: '15px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#3d4852' }}>No technicians found</h3>
              <p style={{ margin: 0, color: '#8a949e', fontSize: '13.5px' }}>{searchTerm ? "Try a different search term." : "Add technicians to the system first."}</p>
            </div>
          ) : (
            <div className="table-wrapper"><table className="payment-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Skills</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Workload</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTechs.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: '14px', fontWeight: 'bold' }}>
                          {t.name.charAt(0)}
                        </div>
                        <strong style={{color: '#2d3748', opacity: t.status === 'Offline' ? 0.5 : 1}}>{t.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {t.skills.split(',').map(skill => (
                          <span key={skill} style={{ background: '#edf2f7', color: '#4a5568', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', opacity: t.status === 'Offline' ? 0.5 : 1 }}>{skill.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4a5568', fontSize: '13px', opacity: t.status === 'Offline' ? 0.5 : 1 }}>
                        <MdPhone size={14} color="#a0aec0" /> {t.contactInformation}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${t.status === 'Available' ? 'resolved' : t.status === 'Offline' ? 'closed' : 'pending'}`}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: t.status === 'Available' ? '#155724' : t.status === 'Offline' ? '#383d41' : '#856404', marginRight: '6px' }}></span>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: t.activeWorkload > 3 ? '#e53e3e' : '#4a5568' }}>
                        {t.activeWorkload} active jobs
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => openEditModal(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3182ce' }} title="Edit">
                          <MdEdit size={18} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }} title="Deactivate">
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </section>

        {/* Form Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>{editingTech ? 'Edit Technician' : 'Add New Technician'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><MdClose size={24} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '8px' }}>Full Name</label>
                  <input type="text" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 18px', borderRadius: '50px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '14px', outline: 'none' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '8px' }}>Contact Number</label>
                  <input type="tel" maxLength={10} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 18px', borderRadius: '50px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '14px', outline: 'none' }} value={formData.contactInformation} onChange={e => { const val = e.target.value.replace(/\D/g, ''); if(val.length <= 10) setFormData({...formData, contactInformation: val}); }} placeholder="e.g. 0771234567" />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '12px' }}>Skills & Expertise</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {availableSkills.map(skill => {
                      const isSelected = formData.skills.includes(skill);
                      return (
                        <button 
                          key={skill}
                          onClick={(e) => {
                            e.preventDefault();
                            let currentSkills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
                            if (isSelected) currentSkills = currentSkills.filter(s => s !== skill);
                            else currentSkills.push(skill);
                            setFormData({...formData, skills: currentSkills.join(', ')});
                          }}
                          style={{ padding: '8px 16px', borderRadius: '50px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', border: isSelected ? '1px solid #3182ce' : '1px solid #e0e0e0', background: isSelected ? '#ebf8ff' : '#fff', color: isSelected ? '#2b6cb0' : '#4a5568' }}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={newSkill} 
                      onChange={e => setNewSkill(e.target.value)} 
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newSkill.trim() && !availableSkills.includes(newSkill.trim())) {
                            const skill = newSkill.trim();
                            setAvailableSkills([...availableSkills, skill]);
                            let currentSkills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
                            if (!currentSkills.includes(skill)) currentSkills.push(skill);
                            setFormData({...formData, skills: currentSkills.join(', ')});
                            setNewSkill('');
                          }
                        }
                      }}
                      placeholder="Add custom skill..." 
                      style={{ padding: '8px 16px', borderRadius: '50px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none', flex: 1 }}
                    />
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        if (newSkill.trim() && !availableSkills.includes(newSkill.trim())) {
                          const skill = newSkill.trim();
                          setAvailableSkills([...availableSkills, skill]);
                          let currentSkills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
                          if (!currentSkills.includes(skill)) currentSkills.push(skill);
                          setFormData({...formData, skills: currentSkills.join(', ')});
                          setNewSkill('');
                        }
                      }}
                      style={{ padding: '8px 16px', borderRadius: '50px', border: 'none', background: '#17212b', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '12px' }}>Status</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['Available', 'Busy', 'Offline'].map(status => (
                      <button
                        key={status}
                        onClick={() => setFormData({...formData, status})}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: formData.status === status ? (status === 'Available' ? '1px solid #38a169' : '1px solid #a0aec0') : '1px solid #e0e0e0', background: formData.status === status ? (status === 'Available' ? '#f0fff4' : '#fff') : '#fff', color: formData.status === status ? (status === 'Available' ? '#22543d' : '#4a5568') : '#a0aec0' }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '50px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button onClick={handleSave} style={{ padding: '10px 24px', border: 'none', borderRadius: '50px', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'}><MdSave size={18} /> Save Technician</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default TechniciansList;
