import { useState, useEffect, useRef, useCallback } from 'react';
import { MdEngineering, MdPhone, MdAdd, MdEdit, MdDelete, MdClose, MdSave, MdSearch, MdCameraAlt } from 'react-icons/md';
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

  // Photo upload
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Lightbox
  const [lightbox, setLightbox] = useState(null); // { src, name }

  const fetchTechs = useCallback(() => {
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
  }, []);

  useEffect(() => {
    fetchTechs();
  }, [fetchTechs]);

  const openAddModal = () => {
    setEditingTech(null);
    setFormData({ name: '', contactInformation: '', skills: '', status: 'Available' });
    setPhotoPreview(null);
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
    setPhotoPreview(tech.photoBase64 || null);

    if (tech.skills) {
      const currentSkills = tech.skills.split(',').map(s => s.trim()).filter(s => s);
      setAvailableSkills(prev => {
        const updated = [...prev];
        currentSkills.forEach(s => { if (!updated.includes(s)) updated.push(s); });
        return updated;
      });
    }
    setShowModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this technician?')) return;
    try {
      setLoading(true);
      await fetch(`http://localhost:5073/api/technicians/${id}`, { method: 'DELETE' });
      fetchTechs();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.skills || !formData.contactInformation) {
      alert('Please fill in all fields.');
      return;
    }
    const contactRegex = /^\d{10}$/;
    if (!contactRegex.test(formData.contactInformation.replace(/\s+/g, ''))) {
      alert('Contact number must be exactly 10 digits.');
      return;
    }

    const payload = {
      ...formData,
      contactInformation: formData.contactInformation.replace(/\s+/g, ''),
      photoBase64: photoPreview || null
    };

    try {
      setLoading(true);
      if (editingTech) {
        await fetch(`http://localhost:5073/api/technicians/${editingTech.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingTech.id })
        });
      } else {
        await fetch('http://localhost:5073/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      fetchTechs();
    } catch (e) {
      console.error('Save failed', e);
      setLoading(false);
    }
  };

  const filteredTechs = techs.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.skills.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColor = (status) => {
    if (status === 'Available') return { badge: 'resolved', dot: '#22543d' };
    if (status === 'Offline') return { badge: 'closed', dot: '#383d41' };
    return { badge: 'pending', dot: '#856404' };
  };

  return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <main className="payment-content">
        <header className="payment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="page-label">MANAGEMENT</p>
            <h1>Technicians Directory</h1>
            <p className="page-description">View skills, availability, and active workload.</p>
          </div>
          <button
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', border: 'none', borderRadius: '50px', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '6px' }}
          >
            <MdAdd size={18} /> Add Technician
          </button>
        </header>

        {/* Search */}
        <div style={{ marginBottom: '20px' }}>
          <div className="search-pill" style={{ maxWidth: '420px' }}>
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
              <h2>Technician List</h2>
              <p style={{ margin: '4px 0 0', color: '#68727c', fontSize: '13px' }}>{filteredTechs.length} technician{filteredTechs.length !== 1 ? 's' : ''} listed</p>
            </div>
          </div>

          {filteredTechs.length === 0 && !loading ? (
            <div className="empty-state" style={{ padding: '60px 20px', borderTop: '1px solid #e3e7e3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MdEngineering size={48} color="#cbd5e0" style={{ marginBottom: '15px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#3d4852' }}>No technicians found</h3>
              <p style={{ margin: 0, color: '#8a949e', fontSize: '13.5px' }}>{searchTerm ? 'Try a different search term.' : 'Add technicians to the system first.'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th style={{ width: '220px' }}>Name</th>
                    <th>Skills</th>
                    <th style={{ width: '150px' }}>Contact</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '120px' }}>Workload</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTechs.map(t => {
                    const sc = statusColor(t.status);
                    return (
                      <tr key={t.id}>
                        {/* Name + Avatar */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {t.photoBase64 ? (
                              <img
                                src={t.photoBase64}
                                alt={t.name}
                                onClick={() => setLightbox({ src: t.photoBase64, name: t.name })}
                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid #e2e8f0', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: '15px', fontWeight: '700', flexShrink: 0 }}>
                                {t.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span style={{ fontWeight: '600', color: '#2d3748', opacity: t.status === 'Offline' ? 0.5 : 1 }}>{t.name}</span>
                          </div>
                        </td>

                        {/* Skills */}
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', opacity: t.status === 'Offline' ? 0.5 : 1 }}>
                            {t.skills.split(',').map(skill => (
                              <span key={skill} style={{ background: '#edf2f7', color: '#4a5568', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>{skill.trim()}</span>
                            ))}
                          </div>
                        </td>

                        {/* Contact */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4a5568', fontSize: '13px', opacity: t.status === 'Offline' ? 0.5 : 1 }}>
                            <MdPhone size={13} color="#a0aec0" /> {t.contactInformation}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`status-badge ${sc.badge}`}>
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, marginRight: '5px' }} />
                            {t.status}
                          </span>
                        </td>

                        {/* Workload */}
                        <td>
                          <span style={{ fontWeight: '600', color: t.activeWorkload > 3 ? '#e53e3e' : '#4a5568', fontSize: '13px' }}>
                            {t.activeWorkload} active {t.activeWorkload === 1 ? 'job' : 'jobs'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => openEditModal(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3182ce', padding: '4px' }} title="Edit">
                              <MdEdit size={18} />
                            </button>
                            <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', padding: '4px' }} title="Delete">
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Photo Lightbox ── */}
        {lightbox && (
          <div
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000, cursor: 'pointer' }}
          >
            <img
              src={lightbox.src}
              alt={lightbox.name}
              style={{ width: '260px', height: '260px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
            />
            <p style={{ marginTop: '20px', color: '#fff', fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>{lightbox.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '6px' }}>Click anywhere to close</p>
          </div>
        )}

        {/* ── Form Modal ── */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{editingTech ? 'Edit Technician' : 'Add New Technician'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><MdClose size={24} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                {/* Photo Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div
                    onClick={() => fileInputRef.current.click()}
                    style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#f0f0f0', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#a0aec0' }}>
                        <MdCameraAlt size={28} />
                        <span style={{ fontSize: '10px', marginTop: '4px' }}>Upload</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                  <span style={{ fontSize: '12px', color: '#a0aec0' }}>Click to upload photo</span>
                </div>

                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '8px' }}>Full Name</label>
                  <input
                    type="text"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 18px', borderRadius: '50px', border: '1px solid #e0e0e0', fontSize: '14px', outline: 'none' }}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '8px' }}>Contact Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 18px', borderRadius: '50px', border: '1px solid #e0e0e0', fontSize: '14px', outline: 'none' }}
                    value={formData.contactInformation}
                    onChange={e => { const val = e.target.value.replace(/\D/g, ''); if (val.length <= 10) setFormData({ ...formData, contactInformation: val }); }}
                    placeholder="e.g. 0771234567"
                  />
                </div>

                {/* Skills */}
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
                            setFormData({ ...formData, skills: currentSkills.join(', ') });
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
                            let cs = formData.skills.split(',').map(s => s.trim()).filter(s => s);
                            if (!cs.includes(skill)) cs.push(skill);
                            setFormData({ ...formData, skills: cs.join(', ') });
                            setNewSkill('');
                          }
                        }
                      }}
                      placeholder="Add custom skill..."
                      style={{ padding: '10px 16px', borderRadius: '50px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none', flex: 1 }}
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (newSkill.trim() && !availableSkills.includes(newSkill.trim())) {
                          const skill = newSkill.trim();
                          setAvailableSkills([...availableSkills, skill]);
                          let cs = formData.skills.split(',').map(s => s.trim()).filter(s => s);
                          if (!cs.includes(skill)) cs.push(skill);
                          setFormData({ ...formData, skills: cs.join(', ') });
                          setNewSkill('');
                        }
                      }}
                      style={{ padding: '10px 18px', borderRadius: '50px', border: 'none', background: '#17212b', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '12px' }}>Status</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['Available', 'Busy', 'Offline'].map(status => (
                      <button
                        key={status}
                        onClick={() => setFormData({ ...formData, status })}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                          border: formData.status === status ? (status === 'Available' ? '2px solid #38a169' : status === 'Busy' ? '2px solid #d69e2e' : '2px solid #718096') : '1px solid #e0e0e0',
                          background: formData.status === status ? (status === 'Available' ? '#f0fff4' : status === 'Busy' ? '#fffff0' : '#f7fafc') : '#fff',
                          color: formData.status === status ? (status === 'Available' ? '#22543d' : status === 'Busy' ? '#744210' : '#4a5568') : '#a0aec0'
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '10px 22px', borderRadius: '50px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Cancel</button>
                <button
                  onClick={handleSave}
                  style={{ padding: '10px 26px', border: 'none', borderRadius: '50px', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MdSave size={18} /> Save Technician
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default TechniciansList;
