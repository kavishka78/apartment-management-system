import { useState, useEffect, useRef, useCallback } from 'react';
import { MdEngineering, MdPhone, MdAdd, MdEdit, MdDelete, MdClose, MdSave, MdSearch, MdCameraAlt, MdAccessTime, MdKeyboardArrowDown, MdKeyboardArrowUp, MdCheck } from 'react-icons/md';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import '../payment/PaymentDashboard.css';
import './Complaints.css';
import '../admin/DomesticStaff.css';

function TechniciansList() {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [skillFilter, setSkillFilter] = useState('All Skills');
  const [accessFilter, setAccessFilter] = useState('All Access');

  // Filter Dropdown Visibility
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null); // 'status', 'skill', 'access'

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [formData, setFormData] = useState({ name: '', contactInformation: '', skills: '', status: 'Available', nicNumber: '', accessPassCode: '', workingHours: '', isAccessGranted: true });
  const [availableSkills, setAvailableSkills] = useState(['Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'General', 'Appliances', 'Painting']);
  const [newSkill, setNewSkill] = useState('');

  // Dropdown state
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const workingHourOptions = [
    "08:00 AM - 05:00 PM (Mon-Fri)",
    "07:00 AM - 07:00 PM (Daily)",
    "09:00 AM - 03:00 PM (Daily)",
    "08:00 AM - 08:00 PM (Daily)",
    "24/7 Access",
    "On-Call / As Needed"
  ];

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
    setFormData({ name: '', contactInformation: '', skills: '', status: 'Available', nicNumber: '', accessPassCode: '', workingHours: '', isAccessGranted: true });
    setPhotoPreview(null);
    setShowTimeDropdown(false);
    setShowModal(true);
  };

  const openEditModal = (tech) => {
    setEditingTech(tech);
    setFormData({
      name: tech.name,
      contactInformation: tech.contactInformation,
      skills: tech.skills,
      status: tech.status,
      nicNumber: tech.nicNumber || '',
      accessPassCode: tech.accessPassCode || '',
      workingHours: tech.workingHours || '',
      isAccessGranted: tech.isAccessGranted !== undefined ? tech.isAccessGranted : true
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
    setShowTimeDropdown(false);
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

  const handleToggleAccess = async (tech) => {
    const updatedTech = { ...tech, isAccessGranted: !tech.isAccessGranted };
    try {
      setLoading(true);
      await fetch(`http://localhost:5073/api/technicians/${tech.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTech)
      });
      fetchTechs();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.skills || !formData.contactInformation || !formData.nicNumber) {
      alert('Please fill in all required fields (Name, Contact, Skills, NIC).');
      return;
    }
    const contactRegex = /^\d{10}$/;
    if (!contactRegex.test(formData.contactInformation.replace(/\s+/g, ''))) {
      alert('Contact number must be exactly 10 digits.');
      return;
    }
    const nicRegex = /^\d{12}$/;
    if (!nicRegex.test(formData.nicNumber)) {
      alert('NIC number must be exactly 12 digits.');
      return;
    }

    const payload = {
      name: formData.name,
      contactInformation: formData.contactInformation.replace(/\s+/g, ''),
      skills: formData.skills,
      status: formData.status,
      nicNumber: formData.nicNumber,
      accessPassCode: formData.accessPassCode,
      workingHours: formData.workingHours,
      isAccessGranted: formData.isAccessGranted,
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

  const filteredTechs = techs.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.skills && t.skills.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All Statuses' || t.status === statusFilter;
    const matchesSkill = skillFilter === 'All Skills' || (t.skills && t.skills.includes(skillFilter));
    const matchesAccess = accessFilter === 'All Access' || 
                          (accessFilter === 'Granted' && t.isAccessGranted) || 
                          (accessFilter === 'Revoked' && !t.isAccessGranted);
    return matchesSearch && matchesStatus && matchesSkill && matchesAccess;
  });

  const renderFilterDropdown = (value, setValue, options, id) => (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.preventDefault(); setOpenFilterDropdown(openFilterDropdown === id ? null : id); }}
        style={{
          padding: '10px 16px', borderRadius: '50px', border: '1px solid #e2e8f0',
          background: value.startsWith('All') ? '#ececec' : '#f5f3ff',
          color: value.startsWith('All') ? '#17212b' : '#6366f1',
          fontSize: '14px', fontWeight: '500', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)', whiteSpace: 'nowrap', fontFamily: '"Montserrat", sans-serif'
        }}
      >
        {value}
        {openFilterDropdown === id ? <MdKeyboardArrowUp size={18} /> : <MdKeyboardArrowDown size={18} />}
      </button>

      {openFilterDropdown === id && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0', overflow: 'hidden', zIndex: 50, minWidth: '160px'
        }}>
          {options.map((option, idx) => (
            <div
              key={idx}
              onClick={() => { setValue(option); setOpenFilterDropdown(null); }}
              style={{
                padding: '10px 16px', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: value === option ? '#f5f3ff' : '#fff',
                color: value === option ? '#6366f1' : '#334155',
                fontWeight: value === option ? '600' : '400',
                borderBottom: idx < options.length - 1 ? '1px solid #f1f5f9' : 'none'
              }}
              onMouseOver={e => { if (value !== option) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseOut={e => { if (value !== option) e.currentTarget.style.background = '#fff'; }}
            >
              {option}
              {value === option && <MdCheck size={16} color="#6366f1" />}
            </div>
          ))}
        </div>
      )}
    </div>
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

        {/* Search & Filters */}
        <div style={{ marginBottom: '20px' }}>
          <div className="search-filter-row">
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
            
            {renderFilterDropdown(statusFilter, setStatusFilter, ['All Statuses', 'Available', 'Busy', 'Offline'], 'status')}
            {renderFilterDropdown(skillFilter, setSkillFilter, ['All Skills', 'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'General', 'Appliances', 'Painting'], 'skill')}
            {renderFilterDropdown(accessFilter, setAccessFilter, ['All Access', 'Granted', 'Revoked'], 'access')}
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
                    <th style={{ width: '220px' }}>Staff Member (Name)</th>
                    <th>Skills</th>
                    <th style={{ width: '130px' }}>Contact</th>
                    <th style={{ width: '130px' }}>NIC Number</th>
                    <th style={{ width: '130px' }}>Pass Code</th>
                    <th style={{ width: '140px' }}>Working Hours</th>
                    <th style={{ width: '110px' }}>Work State</th>
                    <th style={{ width: '130px' }}>Access Status</th>
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
                        
                        {/* NIC Number */}
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', opacity: t.status === 'Offline' ? 0.5 : 1 }}>
                          {t.nicNumber || '-'}
                        </td>
                        
                        {/* Access Pass Code */}
                        <td style={{ opacity: t.status === 'Offline' ? 0.5 : 1 }}>
                          {t.accessPassCode ? <span className="pass-code-tag">🔑 {t.accessPassCode}</span> : '-'}
                        </td>
                        
                        {/* Working Hours */}
                        <td style={{ fontSize: '12px', color: '#64748b', opacity: t.status === 'Offline' ? 0.5 : 1 }}>
                          {t.workingHours || '-'}
                        </td>

                        {/* Work State */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={`status-badge ${sc.badge}`}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, marginRight: '5px' }} />
                              {t.status}
                            </span>
                            <span style={{ fontWeight: '600', color: t.activeWorkload > 3 ? '#e53e3e' : '#4a5568', fontSize: '11px', paddingLeft: '2px' }}>
                              {t.activeWorkload} active {t.activeWorkload === 1 ? 'job' : 'jobs'}
                            </span>
                          </div>
                        </td>
                        
                        {/* Access Status */}
                        <td>
                          <span className={`status-badge ${t.isAccessGranted ? "badge--success" : "badge--danger"}`} style={{ 
                            background: t.isAccessGranted ? '#d1fae5' : '#fee2e2', 
                            color: t.isAccessGranted ? '#065f46' : '#991b1b',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {t.isAccessGranted ? "Granted" : "Revoked"}
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
            <div className="custom-modal-scroll" style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

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

                {/* Additional Details Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* NIC Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '8px' }}>NIC Number (12 Digits)</label>
                    <input
                      type="text"
                      maxLength={12}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 18px', borderRadius: '50px', border: '1px solid #e0e0e0', fontSize: '14px', outline: 'none' }}
                      value={formData.nicNumber}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 12) setFormData({ ...formData, nicNumber: val });
                      }}
                      placeholder="e.g. 199012345678"
                    />
                  </div>
                  
                  {/* Access Pass Code */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '8px' }}>Pass Code</label>
                    <input
                      type="text"
                      disabled={true}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 18px', borderRadius: '50px', border: '1px solid #e0e0e0', fontSize: '14px', outline: 'none', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                      value={formData.accessPassCode || 'Auto-generated on save'}
                      onChange={e => setFormData({ ...formData, accessPassCode: e.target.value })}
                      title="This is automatically generated when the technician is added"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {/* Working Hours (Custom Dropdown) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '8px' }}>Working Hours</label>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => { e.preventDefault(); setShowTimeDropdown(!showTimeDropdown); }}
                          style={{
                            width: '100%', boxSizing: 'border-box', padding: '12px 18px', borderRadius: '50px',
                            border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc',
                            color: formData.workingHours ? '#334155' : '#94a3b8', fontWeight: '500', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MdAccessTime size={18} color={formData.workingHours ? '#6366f1' : '#a0aec0'} />
                            {formData.workingHours || "Select working hours"}
                          </span>
                          {showTimeDropdown ? <MdKeyboardArrowUp size={20} color="#a0aec0" /> : <MdKeyboardArrowDown size={20} color="#a0aec0" />}
                        </button>

                        {showTimeDropdown && (
                          <div style={{
                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                            background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            border: '1px solid #e2e8f0', overflow: 'hidden', zIndex: 50
                          }}>
                            {workingHourOptions.map((option, idx) => (
                              <div
                                key={idx}
                                onClick={(e) => { e.preventDefault(); setFormData({ ...formData, workingHours: option }); setShowTimeDropdown(false); }}
                                style={{
                                  padding: '12px 16px', fontSize: '14px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  background: formData.workingHours === option ? '#f5f3ff' : '#fff',
                                  color: formData.workingHours === option ? '#6366f1' : '#334155',
                                  fontWeight: formData.workingHours === option ? '600' : '400',
                                  borderBottom: idx < workingHourOptions.length - 1 ? '1px solid #f1f5f9' : 'none'
                                }}
                                onMouseOver={e => { if (formData.workingHours !== option) e.currentTarget.style.background = '#f8fafc'; }}
                                onMouseOut={e => { if (formData.workingHours !== option) e.currentTarget.style.background = '#fff'; }}
                              >
                                {option}
                                {formData.workingHours === option && <MdCheck size={18} color="#6366f1" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Access Status */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#68727c', marginBottom: '8px' }}>Access Status</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setFormData({ ...formData, isAccessGranted: true })}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '50px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                          border: formData.isAccessGranted ? '2px solid #38a169' : '1px solid #e0e0e0',
                          background: formData.isAccessGranted ? '#f0fff4' : '#fff',
                          color: formData.isAccessGranted ? '#22543d' : '#a0aec0'
                        }}
                      >
                        Granted
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, isAccessGranted: false })}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '50px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                          border: !formData.isAccessGranted ? '2px solid #e53e3e' : '1px solid #e0e0e0',
                          background: !formData.isAccessGranted ? '#fff5f5' : '#fff',
                          color: !formData.isAccessGranted ? '#9b2c2c' : '#a0aec0'
                        }}
                      >
                        Revoked
                      </button>
                    </div>
                  </div>
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
