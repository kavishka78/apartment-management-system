import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    MdCheckCircle, MdPlayArrow, MdOutlineBuild, MdAccessTime, 
    MdLogout, MdConfirmationNumber, MdLocalPhone, MdFlag, 
    MdAssignment, MdBuild, MdPerson, MdSearch, MdFilterList, 
    MdWarning, MdClose, MdInfoOutline, MdCameraAlt, MdHistory, MdKeyboardArrowDown
} from 'react-icons/md';
import './TechnicianDashboard.css';

const statusStyle = (status) => {
    switch (status) {
        case 'In Progress': return { color: '#4338ca', bg: '#e0e7ff', bar: '#4f46e5', Icon: MdOutlineBuild };
        case 'Assigned': return { color: '#d97706', bg: '#fef3c7', bar: '#f59e0b', Icon: MdAccessTime };
        case 'Resolved': return { color: '#15803d', bg: '#dcfce7', bar: '#16a34a', Icon: MdCheckCircle };
        case 'Closed': return { color: '#475569', bg: '#f1f5f9', bar: '#94a3b8', Icon: MdCheckCircle };
        default: return { color: '#d97706', bg: '#fef3c7', bar: '#f59e0b', Icon: MdAccessTime };
    }
};

const priorityColor = (priority) => {
    if (priority === 'Urgent') return '#991b1b';
    if (priority === 'High') return '#dc2626';
    if (priority === 'Medium') return '#d97706';
    return '#16a34a'; // Low
};

function CustomDropdown({ value, options, onChange, label }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="custom-dropdown">
            <div className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
                {value === 'All' ? label : value} <MdKeyboardArrowDown size={18} className="dd-icon" />
            </div>
            {isOpen && (
                <>
                <div style={{position: 'fixed', inset: 0, zIndex: 90}} onClick={() => setIsOpen(false)}></div>
                <div className="dropdown-menu">
                    <div className="dropdown-menu-header">
                        {label} 
                    </div>
                    <div className={`dropdown-item ${value === 'All' ? 'selected' : ''}`} onClick={() => { onChange('All'); setIsOpen(false); }}>
                        All {value === 'All' && <span className="check">✓</span>}
                    </div>
                    {options.map(opt => (
                        <div 
                            key={opt} 
                            className={`dropdown-item ${value === opt ? 'selected' : ''}`}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                        >
                            {opt} {value === opt && <span className="check">✓</span>}
                        </div>
                    ))}
                </div>
                </>
            )}
        </div>
    );
}

function SkeletonLoader() {
    return (
        <div className="jobs-grid">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="job-card skeleton">
                    <div className="skeleton-bar" />
                    <div className="skeleton-content">
                        <div className="skeleton-line short" />
                        <div className="skeleton-line title" />
                        <div className="skeleton-line desc" />
                        <div className="skeleton-line desc" />
                        <div className="skeleton-footer" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function TechnicianDashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Modals & Forms
    const [resolvingJob, setResolvingJob] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [repairCost, setRepairCost] = useState('');
    
    const [updatingJob, setUpdatingJob] = useState(null);
    const [updateNote, setUpdateNote] = useState('');
    
    const [viewingJob, setViewingJob] = useState(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('http://localhost:5073/api/maintenance');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            const techJobs = data.filter(j =>
                j.technician &&
                (
                    j.technician.contactInformation === currentUser.phone ||
                    j.technician.name === currentUser.name ||
                    j.technician.contactInformation === currentUser.email
                )
            );

            setJobs(techJobs);
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Unable to load work orders');
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?.role !== 'Technician') {
            navigate('/login');
            return;
        }
        fetchJobs();
    }, [currentUser, navigate, fetchJobs]);

    const handleStartWork = async (id) => {
        try {
            const res = await fetch(`http://localhost:5073/api/maintenance/${id}/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ah_token')}` }
            });
            if (res.ok) {
                fetchJobs();
            } else {
                alert('Failed to start work.');
            }
        } catch (err) {
            console.error(err);
            alert('Error starting work');
        }
    };

    const handleResolve = async (e) => {
        e.preventDefault();
        if (!resolvingJob) return;
        const cost = parseFloat(repairCost);
        if (isNaN(cost) || cost < 0) {
            alert('Please enter a valid repair cost (0 or more).');
            return;
        }

        try {
            const res = await fetch(`http://localhost:5073/api/maintenance/${resolvingJob.id}/resolve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ah_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    note: resolutionNotes,
                    repairCost: cost
                })
            });
            
            if (res.ok) {
                setResolvingJob(null);
                setResolutionNotes('');
                setRepairCost('');
                fetchJobs();
            } else {
                alert('Failed to resolve ticket.');
            }
        } catch (err) {
            console.error(err);
            alert('Error resolving ticket');
        }
    };

    const handleUpdateNote = async (e) => {
        e.preventDefault();
        if (!updatingJob || !updateNote.trim()) return;
        try {
            const res = await fetch(`http://localhost:5073/api/maintenance/${updatingJob.id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ah_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    note: updateNote,
                    role: 'Technician'
                })
            });
            
            if (res.ok) {
                setUpdatingJob(null);
                setUpdateNote('');
                fetchJobs();
            } else {
                alert('Failed to add note.');
            }
        } catch (err) {
            console.error(err);
            alert('Error adding note');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const activeJobs = jobs.filter(j => j.status === 'Assigned' || j.status === 'In Progress');
    const assignedCount = activeJobs.filter(j => j.status === 'Assigned').length;
    const inProgressCount = activeJobs.filter(j => j.status === 'In Progress').length;
    const highPriorityCount = activeJobs.filter(j => j.priority === 'High' || j.priority === 'Urgent').length;
    const slaAtRiskCount = activeJobs.filter(j => j.slaStatus === 'At Risk' || j.slaStatus === 'Overdue').length;

    const filteredJobs = useMemo(() => {
        let result = [...jobs];
        
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(j => 
                j.title.toLowerCase().includes(lower) || 
                j.id.toString().includes(lower) ||
                j.description.toLowerCase().includes(lower) ||
                (j.category?.name || '').toLowerCase().includes(lower)
            );
        }
        
        if (statusFilter !== 'All') {
            result = result.filter(j => j.status === statusFilter);
        }
        
        if (priorityFilter !== 'All') {
            result = result.filter(j => j.priority === priorityFilter);
        }
        
        result.sort((a, b) => {
            const slaMap = { "Overdue": 3, "At Risk": 2, "Normal": 1 };
            const slaA = slaMap[a.slaStatus] || 1;
            const slaB = slaMap[b.slaStatus] || 1;
            if (slaA !== slaB) return slaB - slaA;
            
            const prioMap = { "Urgent": 4, "High": 3, "Medium": 2, "Low": 1 };
            const prioA = prioMap[a.priority] || 1;
            const prioB = prioMap[b.priority] || 1;
            if (prioA !== prioB) return prioB - prioA;
            
            const statMap = { "In Progress": 3, "Assigned": 2, "Resolved": 1, "Closed": 0 };
            const statA = statMap[a.status] || 0;
            const statB = statMap[b.status] || 0;
            if (statA !== statB) return statB - statA;
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        return result;
    }, [jobs, searchTerm, statusFilter, priorityFilter]);

    return (
        <motion.div className="technician-page" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} transition={{duration:0.25, ease:"easeInOut"}}>
            <div className="ah-container">

                <div className="ah-header">
                    <div className="profile-section">
                        <div className="profile-avatar">
                            {currentUser?.photo ? (
                                <img src={currentUser.photo} alt={currentUser?.name} />
                            ) : (
                                <MdPerson size={24} color="#fff" />
                            )}
                        </div>

                        <div>
                            <h1>Welcome, {currentUser?.name}</h1>
                            <div className="user-info">
                                <span>My Work Orders</span>
                                {currentUser?.phone && (
                                    <>
                                        <span className="divider">|</span>
                                        <MdLocalPhone size={14} />
                                        <span>{currentUser.phone}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="header-right">
                        <span className="stat-pill yellow">{assignedCount} assigned</span>
                        <span className="stat-pill purple">{inProgressCount} in progress</span>
                        <button onClick={handleLogout} className="signout-btn">
                            <MdLogout size={16} /> Sign out
                        </button>
                    </div>
                </div>

                                <div className="hero-section">
                    <div className="hero-text">
                        <h4>TECHNICIAN PORTAL</h4>
                        <h2>Manage your assigned work orders.</h2>
                        <p>View assigned maintenance tickets, track work progress, update repairs, and resolve completed jobs.</p>
                    </div>
                    
                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon"><MdAssignment size={20} /></div>
                            <h3>View Assignments</h3>
                            <p>Instantly see all maintenance tickets routed to you.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><MdOutlineBuild size={20} /></div>
                            <h3>Track Progress</h3>
                            <p>Start repairs and update your ongoing jobs.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><MdCheckCircle size={20} /></div>
                            <h3>Resolve Tickets</h3>
                            <p>Mark completed jobs as resolved quickly.</p>
                        </div>
                    </div>
                </div>

<div className="filters-bar">
                    <div className="search-box">
                        <MdSearch size={20} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search complaints by title..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <MdFilterList size={20} className="filter-icon" />
                    </div>
                    <div className="filter-selects">
                        <CustomDropdown 
                            label="All Statuses" 
                            value={statusFilter} 
                            onChange={setStatusFilter} 
                            options={['Assigned', 'In Progress', 'Resolved', 'Closed']} 
                        />
                        <CustomDropdown 
                            label="All Priorities" 
                            value={priorityFilter} 
                            onChange={setPriorityFilter} 
                            options={['Low', 'Medium', 'High', 'Urgent']} 
                        />
                    </div>
                </div>

                {loading ? (
                    <SkeletonLoader />
                ) : error ? (
                    <div className="error-state">
                        <MdWarning size={40} color="#dc2626" />
                        <h3>{error}</h3>
                        <button onClick={fetchJobs} className="retry-btn">Try Again</button>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="empty-state">
                        <MdAssignment size={48} color="#94a3b8" />
                        <h3>No work orders found</h3>
                        <p>You currently have no maintenance jobs matching these filters.</p>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        <AnimatePresence>
                            {filteredJobs.map(job => {
                                const s = statusStyle(job.status);
                                const StatusIcon = s.Icon;
                                const pColor = priorityColor(job.priority);
                                const isSlaRisk = job.slaStatus === 'At Risk' || job.slaStatus === 'Overdue';

                                return (
                                    <motion.div 
                                        key={job.id} 
                                        className="job-card"
                                        initial={{opacity: 0, scale: 0.95}}
                                        animate={{opacity: 1, scale: 1}}
                                        exit={{opacity: 0, scale: 0.95}}
                                        layout
                                    >
                                        <div className="status-bar" style={{ backgroundColor: s.bar }} />

                                        <div className="job-content">
                                            <div className="job-meta">
                                                <span className="status-badge" style={{ backgroundColor: s.bg, color: s.color }}>
                                                    <StatusIcon size={12} /> {job.status}
                                                </span>
                                                <span className="priority-badge" style={{ color: pColor, backgroundColor: pColor + '15' }}>
                                                    <MdFlag size={12} /> {job.priority}
                                                </span>
                                                <span className="ticket-number">Ticket #{job.id}</span>
                                            </div>

                                            <h3 className="job-title">{job.title}</h3>
                                            
                                            <div className="job-details-compact">
                                                <span><strong>Category:</strong> {job.category?.name || 'General'}</span>
                                                <span className="divider">•</span>
                                                <span><strong>Unit:</strong> Resident {job.residentId}</span>
                                            </div>

                                            <p className="job-desc">{job.description}</p>

                                            {job.photoPath && (
                                                <div className="job-photo-preview">
                                                    <img src={`http://localhost:5073${job.photoPath}`} alt="Complaint" />
                                                </div>
                                            )}

                                            <div className="job-footer">
                                                <div className={`sla-indicator ${isSlaRisk ? 'risk' : ''}`}>
                                                    <MdAccessTime size={14} />
                                                    SLA: {job.slaDueDate ? new Date(job.slaDueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                                    {isSlaRisk && <span className="sla-tag">({job.slaStatus})</span>}
                                                </div>

                                                <div className="job-actions">
                                                    <button onClick={() => setViewingJob(job)} className="action-btn view-btn">
                                                        <MdInfoOutline size={16} /> Details
                                                    </button>
                                                    
                                                    {job.status === 'Assigned' && (
                                                        <button onClick={() => handleStartWork(job.id)} className="action-btn start-btn">
                                                            <MdPlayArrow size={16} /> Start Work
                                                        </button>
                                                    )}
                                                    
                                                    {job.status === 'In Progress' && (
                                                        <>
                                                            <button onClick={() => setUpdatingJob(job)} className="action-btn update-btn">
                                                                <MdHistory size={16} /> Update
                                                            </button>
                                                            <button onClick={() => setResolvingJob(job)} className="action-btn resolve-btn">
                                                                <MdCheckCircle size={16} /> Mark resolved
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {resolvingJob && (
                    <div className="modal-overlay" onClick={() => setResolvingJob(null)}>
                        <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}}>
                            <div className="modal-header">
                                <h2>Resolve Ticket #{resolvingJob.id}</h2>
                                <button className="close-btn" onClick={() => setResolvingJob(null)}><MdClose size={20}/></button>
                            </div>
                            <form onSubmit={handleResolve} className="modal-body">
                                <div className="form-group">
                                    <label>Resolution Notes</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        value={resolutionNotes}
                                        onChange={e => setResolutionNotes(e.target.value)}
                                        placeholder="Describe the repairs made..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Repair Cost (Rs.)</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={repairCost}
                                        onChange={e => setRepairCost(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setResolvingJob(null)}>Cancel</button>
                                    <button type="submit" className="btn-confirm"><MdCheckCircle size={16}/> Mark Resolved</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {updatingJob && (
                    <div className="modal-overlay" onClick={() => setUpdatingJob(null)}>
                        <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}}>
                            <div className="modal-header">
                                <h2>Update Ticket #{updatingJob.id}</h2>
                                <button className="close-btn" onClick={() => setUpdatingJob(null)}><MdClose size={20}/></button>
                            </div>
                            <form onSubmit={handleUpdateNote} className="modal-body">
                                <div className="form-group">
                                    <label>Work Note</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        value={updateNote}
                                        onChange={e => setUpdateNote(e.target.value)}
                                        placeholder="Add an update to the timeline..."
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setUpdatingJob(null)}>Cancel</button>
                                    <button type="submit" className="btn-confirm update-btn"><MdHistory size={16}/> Add Note</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewingJob && (
                    <div className="modal-overlay" onClick={() => setViewingJob(null)}>
                        <motion.div className="modal-content details-modal" onClick={e => e.stopPropagation()} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}}>
                            <div className="modal-header">
                                <div>
                                    <span className="ticket-number-large">Ticket #{viewingJob.id}</span>
                                    <h2>{viewingJob.title}</h2>
                                </div>
                                <button className="close-btn" onClick={() => setViewingJob(null)}><MdClose size={20}/></button>
                            </div>
                            <div className="modal-body details-body">
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <label>Status</label>
                                        <div className="val"><span className="status-badge" style={{ backgroundColor: statusStyle(viewingJob.status).bg, color: statusStyle(viewingJob.status).color }}>{viewingJob.status}</span></div>
                                    </div>
                                    <div className="detail-item">
                                        <label>Priority</label>
                                        <div className="val"><span className="priority-badge" style={{ color: priorityColor(viewingJob.priority), backgroundColor: priorityColor(viewingJob.priority) + '15' }}>{viewingJob.priority}</span></div>
                                    </div>
                                    <div className="detail-item">
                                        <label>Category</label>
                                        <div className="val">{viewingJob.category?.name || 'General'}</div>
                                    </div>
                                    <div className="detail-item">
                                        <label>Resident ID</label>
                                        <div className="val">{viewingJob.residentId}</div>
                                    </div>
                                    <div className="detail-item">
                                        <label>SLA Due</label>
                                        <div className={`val ${viewingJob.slaStatus === 'Overdue' ? 'text-red' : ''}`}>{viewingJob.slaDueDate ? new Date(viewingJob.slaDueDate).toLocaleString() : 'N/A'}</div>
                                    </div>
                                    <div className="detail-item">
                                        <label>SLA Status</label>
                                        <div className={`val ${viewingJob.slaStatus === 'Overdue' ? 'text-red' : ''}`}>{viewingJob.slaStatus}</div>
                                    </div>
                                </div>
                                
                                <div className="detail-section">
                                    <label>Description</label>
                                    <p className="val-desc">{viewingJob.description}</p>
                                </div>

                                {viewingJob.photoPath && (
                                    <div className="detail-section">
                                        <label>Attached Photo</label>
                                        <img className="val-img" src={`http://localhost:5073${viewingJob.photoPath}`} alt="Complaint Evidence" />
                                    </div>
                                )}

                                <div className="detail-section timeline-section">
                                    <label>Timeline & History</label>
                                    <div className="timeline">
                                        {(viewingJob.history || []).map((h, i) => (
                                            <div key={i} className="timeline-item">
                                                <div className="timeline-dot" />
                                                <div className="timeline-content">
                                                    <div className="timeline-head">
                                                        <strong>{h.status}</strong>
                                                        <span className="timeline-date">{new Date(h.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                    </div>
                                                    {h.note && <p className="timeline-note">{h.note}</p>}
                                                    <span className="timeline-by">By {h.changedBy}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
