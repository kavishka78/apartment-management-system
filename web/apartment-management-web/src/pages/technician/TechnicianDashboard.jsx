import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    MdOutlineBuild, MdAccessTime, MdLogout, MdSearch, MdKeyboardArrowDown,
    MdPlayArrow, MdCheckCircle, MdHistory, MdPerson, MdOutlineDescription,
    MdOutlinePhotoCamera, MdOutlineTimer, MdOutlineStickyNote2,
    MdAssignment, MdTrackChanges, MdAcUnit,
    MdChevronRight, MdOutlineBolt, MdWaterDrop, MdListAlt, MdImage, MdPhone, MdEmail } from 'react-icons/md';
import './TechnicianDashboard.css';

const statusStyle = (status) => {
    switch (status) {
        case 'In Progress': return { color: '#3b82f6', bg: '#eff6ff', border: 'transparent' };
        case 'Assigned': return { color: '#64748b', bg: '#f1f5f9', border: 'transparent' };
        case 'Resolved': return { color: '#10b981', bg: '#ecfdf5', border: 'transparent' };
        case 'Closed': return { color: '#64748b', bg: '#f1f5f9', border: 'transparent' };
        default: return { color: '#64748b', bg: '#f1f5f9', border: 'transparent' };
    }
};

const priorityStyle = (priority) => {
    switch (priority) {
        case 'Urgent': return { color: '#ef4444', bg: '#fef2f2', border: 'transparent' };
        case 'High': return { color: '#ef4444', bg: '#fef2f2', border: 'transparent' };
        case 'Medium': return { color: '#f59e0b', bg: '#fffbeb', border: 'transparent' };
        default: return { color: '#10b981', bg: '#ecfdf5', border: 'transparent' };
    }
};

const getCategoryIconData = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('electrical') || name.includes('power') || name.includes('spark')) {
        return { icon: <MdOutlineBolt size={24} />, color: '#ef4444', bg: '#fee2e2' };
    }
    if (name.includes('plumb') || name.includes('water') || name.includes('leak') || name.includes('sink')) {
        return { icon: <MdWaterDrop size={24} />, color: '#3b82f6', bg: '#dbeafe' };
    }
    if (name.includes('ac') || name.includes('hvac') || name.includes('cool')) {
        return { icon: <MdAcUnit size={24} />, color: '#0ea5e9', bg: '#e0f2fe' };
    }
    return { icon: <MdOutlineBuild size={24} />, color: '#64748b', bg: '#f1f5f9' };
};

function CustomDropdown({ value, options, onChange, label }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="custom-dropdown">
            <div className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
                {value === 'All' ? label : value} <MdKeyboardArrowDown size={16} color="#64748b" />
            </div>
            {isOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setIsOpen(false)} />
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => { onChange('All'); setIsOpen(false); }}>All</div>
                        {options.map(opt => (
                            <div key={opt} className={`dropdown-item ${value === opt ? 'selected' : ''}`}
                                onClick={() => { onChange(opt); setIsOpen(false); }}>
                                {opt}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function TechnicianDashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [activeAction, setActiveAction] = useState(null);
    const [actionNote, setActionNote] = useState('');
    const [actionCost, setActionCost] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');

    const fetchJobs = useCallback(async () => {
        if (!currentUser) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('ah_token');
            const res = await fetch('http://localhost:5073/api/maintenance', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            const techJobs = data.filter(j =>
                j.technician && (
                    j.technician.contactInformation === currentUser.phone ||
                    j.technician.name === currentUser.name ||
                    j.technician.contactInformation === currentUser.email
                )
            );
            techJobs.sort((a, b) => {
                const pMap = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                const pDiff = (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
                if (pDiff !== 0) return pDiff;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setJobs(techJobs);
            if (techJobs.length > 0) {
                setSelectedJob(prev => {
                    if (prev) { const u = techJobs.find(t => t.id === prev.id); return u || techJobs[0]; }
                    return techJobs[0];
                });
            } else { setSelectedJob(null); }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'Technician') { navigate('/login'); return; }
        const doFetch = async () => { await fetchJobs(); };
        doFetch();
        const interval = setInterval(doFetch, 30000);
        return () => clearInterval(interval);
    }, [currentUser, navigate, fetchJobs]);

    const filteredJobs = useMemo(() => {
        let result = [...jobs];
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(j => j.title?.toLowerCase().includes(lower) || j.id?.toString().includes(lower) || j.description?.toLowerCase().includes(lower));
        }
        if (statusFilter !== 'All') result = result.filter(j => j.status === statusFilter);
        if (priorityFilter !== 'All') result = result.filter(j => j.priority === priorityFilter);
        return result;
    }, [jobs, searchTerm, statusFilter, priorityFilter]);

    if (!currentUser) return null;

    const handleStartWork = async (id) => {
        try {
            const res = await fetch(`http://localhost:5073/api/maintenance/${id}/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ah_token')}`, 'Content-Type': 'application/json' }
            });
            if (res.ok) fetchJobs(); else alert('Failed to start work');
        } catch (err) { console.error(err); alert('Error starting work'); }
    };

    const submitInlineAction = async () => {
        if (!selectedJob || !activeAction || !actionNote.trim()) { alert('Please enter a note'); return; }
        try {
            if (activeAction === 'resolve') {
                const cost = parseFloat(actionCost) || 0;
                const res = await fetch(`http://localhost:5073/api/maintenance/${selectedJob.id}/resolve`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('ah_token')}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ note: actionNote, repairCost: cost })
                });
                if (res.ok) { setActiveAction(null); fetchJobs(); } else alert('Failed to resolve');
            } else {
                const res = await fetch(`http://localhost:5073/api/maintenance/${selectedJob.id}/comments`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('ah_token')}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ note: actionNote, role: 'Technician' })
                });
                if (res.ok) { setActiveAction(null); fetchJobs(); } else alert('Failed to add note');
            }
        } catch (err) { console.error(err); alert('Error submitting'); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };


    const assignedCount = jobs.filter(j => j.status === 'Assigned').length;
    const inProgressCount = jobs.filter(j => j.status === 'In Progress').length;

    return (
        <div className="technician-dashboard">
            {/* ===== WHITE TOP BAR ===== */}
            <header className="tech-topbar">
                <div className="topbar-left">
                    <div className="topbar-avatar">
                        <MdPerson size={24} />
                    </div>
                    <div className="topbar-info">
                        <h2>Welcome, {currentUser?.name || currentUser?.email}</h2>
                        <span><MdListAlt size={15} style={{marginBottom: '-3px', marginRight: '4px'}}/> My work orders</span>
                    </div>
                </div>
                <div className="topbar-right">
                    <span className="pill-badge pill-yellow">{assignedCount} assigned</span>
                    <span className="pill-badge pill-amber">{inProgressCount} in progress</span>
                    <button onClick={handleLogout} className="pill-badge pill-red">
                        <MdLogout size={16} /> Sign out
                    </button>
                </div>
            </header>

            {/* ===== DARK HERO BANNER ===== */}
            <section className="tech-hero">
                <div className="hero-left">
                    <span className="hero-label">TECHNICIAN PORTAL</span>
                    <h1>Manage your<br />assigned work orders.</h1>
                    <p>Access your daily maintenance tickets, track your repair progress, and ensure residents receive fast and reliable service.</p>
                </div>
                <div className="hero-cards">
                    <div className="hero-card">
                        <div className="hc-icon"><MdAssignment size={28} /></div>
                        <strong>VIEW ASSIGNMENTS</strong>
                        <p>Instantly see all maintenance tickets routed to you.</p>
                    </div>
                    <div className="hero-card">
                        <div className="hc-icon"><MdTrackChanges size={28} /></div>
                        <strong>TRACK PROGRESS</strong>
                        <p>Start repairs and update your ongoing jobs.</p>
                    </div>
                    <div className="hero-card">
                        <div className="hc-icon"><MdCheckCircle size={28} /></div>
                        <strong>RESOLVE TICKETS</strong>
                        <p>Mark completed jobs as resolved quickly.</p>
                    </div>
                </div>
            </section>

            {/* ===== SPLIT VIEW ===== */}
            <main className="tech-main">
                <div className="split-container">

                    {/* LEFT PANE */}
                    <div className="left-pane">
                        <div className="lp-header">
                            <h2>My Work Orders</h2>
                            <div className="search-box">
                                <MdSearch size={20} color="#94a3b8" />
                                <input type="text" placeholder="Search tickets, keywords..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="filter-selects">
                                <CustomDropdown value={statusFilter} options={['Assigned', 'In Progress', 'Resolved', 'Closed']} onChange={setStatusFilter} label="All Status" />
                                <CustomDropdown value={priorityFilter} options={['Low', 'Medium', 'High', 'Urgent']} onChange={setPriorityFilter} label="All Priority" />
                            </div>
                        </div>
                        <div className="compact-list">
                            {loading && jobs.length === 0 ? (
                                <div className="empty-state">Loading work orders...</div>
                            ) : filteredJobs.length === 0 ? (
                                <div className="empty-state">No work orders found.</div>
                            ) : (
                                filteredJobs.map(job => {
                                    const isSelected = selectedJob?.id === job.id;
                                    const sStyle = statusStyle(job.status);
                                    const pStyle = priorityStyle(job.priority);
                                    const catData = getCategoryIconData(job.category?.name);
                                    return (
                                        <div key={job.id} className={`list-card ${isSelected ? 'active' : ''}`} onClick={() => setSelectedJob(job)}>
                                            <div className="lc-icon" style={{ backgroundColor: catData.bg, color: catData.color }}>
                                                {catData.icon}
                                            </div>
                                            <div className="lc-content">
                                                <div className="lc-top">
                                                    <span className="lc-id">#{String(job.id).padStart(3, '0')}</span>
                                                    <div className="lc-badges">
                                                        <span className="rect-badge" style={{ color: pStyle.color, background: pStyle.bg }}>{job.priority}</span>
                                                        <span className="rect-badge" style={{ color: sStyle.color, background: sStyle.bg }}>{job.status}</span>
                                                    </div>
                                                </div>
                                                <h4 className="lc-title">{job.title}</h4>
                                                <div className="lc-meta-row">
                                                    <span className="lc-unit">Unit R-0{job.residentId || 1} • {job.category?.name || 'General'}</span>
                                                    <span className={`lc-date ${job.slaStatus === 'Overdue' ? 'text-red' : ''}`}>
                                                        <MdAccessTime size={14} style={{marginBottom: '-2px', marginRight: '2px'}}/> 
                                                        {new Date(job.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="lc-desc">{job.description}</p>
                                            </div>
                                            <div className="lc-chevron"><MdChevronRight size={24} /></div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE */}
                    <div className="right-pane">
                        {!selectedJob ? (
                            <div className="empty-selection"><p>Select a work order to view details</p></div>
                        ) : (
                            <div className="details-view">
                                {/* Header */}
                                <div className="rp-top">
                                    <div className="rp-ticket-id">
                                        <strong>Ticket #{String(selectedJob.id).padStart(3, '0')}</strong>
                                        <span className="rect-badge" style={{ color: statusStyle(selectedJob.status).color, background: statusStyle(selectedJob.status).bg }}>{selectedJob.status}</span>
                                    </div>
                                    <div className="rp-actions">
                                        {selectedJob.status === 'Assigned' && (
                                            <button onClick={() => handleStartWork(selectedJob.id)} className="rect-btn rect-btn-green"><MdPlayArrow size={16} /> Start Repair</button>
                                        )}
                                        {selectedJob.status === 'In Progress' && (
                                            <>
                                                <button onClick={() => { setActiveAction('update'); setActionNote(''); }} className="rect-btn rect-btn-outline">Update</button>
                                                <button onClick={() => { setActiveAction('resolve'); setActionNote(''); setActionCost(''); }} className="rect-btn rect-btn-green"><MdCheckCircle size={16} /> Mark Resolved</button>
                                            </>
                                        )}
                                        {/* "More" Button explicitly removed per user request */}
                                    </div>
                                </div>

                                <div className="rp-title-row">
                                    <h1>{selectedJob.title}</h1>
                                    <span className="rect-badge" style={{ color: priorityStyle(selectedJob.priority).color, background: priorityStyle(selectedJob.priority).bg }}>{selectedJob.priority}</span>
                                </div>

                                <div className="rp-meta-bar">
                                    <span><MdOutlineBuild size={16} /> Unit {selectedJob.unitNumber || `R-0${selectedJob.residentId}`}</span>
                                    <span><MdListAlt size={16} /> {selectedJob.category?.name || 'Electrical'}</span>
                                    <span className={selectedJob.slaStatus === 'Overdue' ? 'text-red' : ''}><MdAccessTime size={16} /> {new Date(selectedJob.createdAt).toLocaleString()} {selectedJob.slaStatus === 'Overdue' ? '(Overdue)' : ''}</span>
                                </div>

                                <div className="rp-section">
                                    <h4><MdOutlineDescription size={18} /> Description</h4>
                                    <p>{selectedJob.description}</p>
                                </div>

                                <div className="rp-section">
                                    <h4><MdPerson size={18} /> Resident Information</h4>
                                    <div className="rp-info-block" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '12px' }}>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '600' }}>
                                            <MdPerson size={16} color="#64748b" /> {selectedJob.residentName || `Dr. Anoma Jayasinghe`}
                                        </p>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MdPhone size={16} color="#3b82f6" /> {selectedJob.residentPhone || '+94 71 889 2341'}
                                        </p>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MdEmail size={16} color="#10b981" /> resident{selectedJob.residentId}@example.com
                                        </p>
                                    </div>
                                </div>

                                <div className="rp-section">
                                    <h4><MdOutlinePhotoCamera size={18} /> Photos</h4>
                                    <div className="photos-row">
                                        {selectedJob.photoPath && <img src={`http://localhost:5073${selectedJob.photoPath}`} alt="Photo" className="photo-thumb" style={{ cursor: 'pointer' }} onClick={() => setLightboxImage(`http://localhost:5073${selectedJob.photoPath}`)} />}
                                        <button className="add-photo-btn">
                                            <MdImage size={24} />
                                            <span>Photo</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="rp-section">
                                    <h4><MdOutlineTimer size={18} /> SLA Information</h4>
                                    <div className="sla-grid">
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdAccessTime size={16} color="#f59e0b" /> Due Date</label>
                                            <p>{selectedJob.slaDueDate ? new Date(selectedJob.slaDueDate).toLocaleString() : '9/26/2026, 3:28:04 PM'}</p>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdCheckCircle size={16} color={selectedJob.slaStatus === 'Overdue' ? '#ef4444' : '#10b981'} /> Status</label>
                                            <span className={`rect-badge ${selectedJob.slaStatus === 'Overdue' ? 'overdue' : ''}`}>{selectedJob.slaStatus || 'Overdue'}</span>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdOutlineTimer size={16} color="#3b82f6" /> Time Remaining</label>
                                            <p className={selectedJob.slaStatus === 'Overdue' ? 'text-red' : ''}>—</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rp-section">
                                    <h4><MdOutlineStickyNote2 size={18} /> Notes</h4>
                                    {activeAction ? (
                                        <div className="inline-form">
                                            <textarea rows="3" placeholder={activeAction === 'resolve' ? 'Resolution notes...' : 'Add notes about this work order...'} value={actionNote} onChange={e => setActionNote(e.target.value)} autoFocus />
                                            {activeAction === 'resolve' && <input type="number" placeholder="Repair cost in Rs." value={actionCost} onChange={e => setActionCost(e.target.value)} />}
                                            <div className="form-actions">
                                                <button onClick={() => setActiveAction(null)} className="rect-btn rect-btn-outline">Cancel</button>
                                                <button onClick={submitInlineAction} className="rect-btn rect-btn-dark">Submit</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="notes-placeholder" onClick={() => setActiveAction('update')}>Add notes about this work order...</div>
                                    )}
                                </div>

                                {/* Timeline */}
                                {(selectedJob.history || []).length > 0 && (
                                    <div className="rp-section">
                                        <h4><MdHistory size={18} /> Timeline</h4>
                                        <div className="timeline">
                                            {selectedJob.history.map((h, i) => (
                                                <div key={i} className="tl-item">
                                                    <div className="tl-dot" />
                                                    <div className="tl-content">
                                                        <div className="tl-head">
                                                            <strong>{h.status}</strong>
                                                            <span>{new Date(h.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                        </div>
                                                        {h.note && <p>{h.note}</p>}
                                                        <span className="tl-by">BY {h.changedBy?.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {lightboxImage && (
                <div 
                    onClick={() => setLightboxImage(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'pointer' }}
                >
                    <img 
                        src={lightboxImage} 
                        alt="Enlarged Photo" 
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
                    />
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '12px' }}>Click anywhere to close</p>
                </div>
            )}
        </div>
    );
}
