const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5073/api';
import { useState, useEffect, useCallback } from 'react';
import { getAuthToken } from '../../services/api';
import { MAINTENANCE_API_ORIGIN } from './maintenanceApi';
import { useParams, useNavigate } from 'react-router-dom';
import { MdAutoAwesome, MdStar, MdPlayArrow, MdCheckCircle, MdClose, MdComment, MdArrowBack, MdChevronRight, MdKeyboardArrowDown, MdBuild, MdFlag, MdPerson, MdAttachMoney, MdPhone, MdHome, MdPriorityHigh, MdDescription, MdAccessTime } from 'react-icons/md';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import { motion } from 'framer-motion';
import '../payment/PaymentDashboard.css';
import './MaintenanceDetails.css';

function MaintenanceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);
    const [loading, setLoading] = useState(true);

  // For resolution and comments
  const [repairCost, setRepairCost] = useState('');
  const [note, setNote] = useState('');
  const [commentNote, setCommentNote] = useState('');

  // For manual assignment
  const [showManualAssign, setShowManualAssign] = useState(false);
  const [availableTechs, setAvailableTechs] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

const fetchWithAuth = useCallback((url, options = {}) => {
    const token = getAuthToken();
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  }, []);

  const fetchTicket = useCallback(() => {
    fetchWithAuth(`${API_BASE}/maintenance/${id}`)
      .then(res => res.json())
      .then(data => {
        setTicket(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id, fetchWithAuth]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const [showReviseForm, setShowReviseForm] = useState(false);
  const [reviseFeedback, setReviseFeedback] = useState('');
  const [recommendedTech, setRecommendedTech] = useState(null);

  useEffect(() => {
    if (aiRecommendation?.recommendedTechnicianId) {
      fetchWithAuth(`${API_BASE}/technicians/${aiRecommendation.recommendedTechnicianId}`)
        .then(res => res.json())
        .then(data => setRecommendedTech(data))
        .catch(err => console.error(err));
    } else {
      // eslint-disable-next-line
      setRecommendedTech(null);
    }
  }, [aiRecommendation?.recommendedTechnicianId, fetchWithAuth]);

  const loadAiTriage = () => {
    setAiRecommendation({ loading: true });
    fetchWithAuth(`${API_BASE}/maintenance/${id}/triage`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setAiRecommendation(data))
      .catch(err => {
        console.error(err);
        setAiRecommendation({ error: 'Failed to connect to Python Agent on port 8000. Is it running?' });
      });
  };

    const submitRevision = () => {
    if (!reviseFeedback.trim()) {
        alert('Please enter your feedback for the AI Agent.');
        return;
    }
    
    // Mark old workflow as revised first
    if (aiRecommendation?.workflowId) {
      fetchWithAuth(`${API_BASE}/maintenance/workflows/${aiRecommendation.workflowId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'RequestRevision', note: reviseFeedback, approvedBy: 'Manager' })
      });
    }

    setAiRecommendation(null);
    setShowReviseForm(false);
    fetchWithAuth(`${API_BASE}/maintenance/${id}/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerFeedback: reviseFeedback })
    })
    .then(res => res.json())
    .then(data => {
        setAiRecommendation(data);
        fetchTicket();
    })
    .catch(err => {
        console.error(err);
        setAiRecommendation({ error: 'Failed to revise AI recommendation.' });
    });
  };

    const handleReject = () => {
    // Mark workflow as rejected
    if (aiRecommendation?.workflowId) {
      fetchWithAuth(`${API_BASE}/maintenance/workflows/${aiRecommendation.workflowId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'Reject', note: 'Rejected by manager', approvedBy: 'Manager' })
      });
    }

    setAiRecommendation(null);
    fetchWithAuth(`${API_BASE}/maintenance/${id}/reject`, {
      method: 'POST'
    })
    .then(res => {
        if (res.ok) fetchTicket();
    });
  };

  const loadAvailableTechs = () => {
    fetchWithAuth(`${API_BASE}/technicians`)
      .then(res => res.json())
      .then(data => {
        setAvailableTechs(data.filter(t => t.status === 'Available'));
        setShowManualAssign(true);
      })
      .catch(err => console.error("Failed to load techs", err));
  };

  const handleManualAssign = () => {
    if (!selectedTechId) return;
    fetchWithAuth(`${API_BASE}/maintenance/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId: parseInt(selectedTechId) })
    })
    .then(res => {
      if (res.ok) {
        setShowManualAssign(false);
        fetchTicket();
      }
    });
  };

  const handleWorkflowDecision = (decision) => {
    if (!aiRecommendation?.workflowId) {
      alert('Run AI triage before making an approval decision.');
      return;
    }
    fetchWithAuth(`${API_BASE}/maintenance/workflows/${aiRecommendation.workflowId}/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        note: decision === 'Approve' ? 'Approved after manager review.' : 'Manager decision recorded.',
        approvedBy: 'Manager'
      })
    }).then(res => {
      if (!res.ok) return res.text().then(message => alert(message));
      setAiRecommendation(null);
      fetchTicket();
    });
  };

  const handlePriorityChange = (newPriority) => {
    fetchWithAuth(`${API_BASE}/maintenance/${id}/priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: newPriority })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update priority');
        return res.json();
      })
      .then(data => {
        setTicket(data);
      })
      .catch(err => {
        console.error(err);
        alert('Failed to update priority');
      });
  };

  const handleStartWork = () => {
    fetchWithAuth(`${API_BASE}/maintenance/${id}/start`, { method: 'POST' })
      .then(res => res.ok && fetchTicket());
  };

  const handleResolve = () => {
    fetchWithAuth(`${API_BASE}/maintenance/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repairCost: parseFloat(repairCost || 0), note })
    }).then(res => {
      if (res.ok) {
        setNote('');
        fetchTicket();
      }
    });
  };

  const handleClose = () => {
    // Admin force-closes the ticket on behalf of resident or after manual verification
    fetchWithAuth(`${API_BASE}/maintenance/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: true, note: 'Admin forcibly closed ticket.' })
    }).then(res => {
      if (res.ok) {
        setNote('');
        fetchTicket();
      }
    });
  };

  const handleAddComment = () => {
    if (!commentNote) return;
    fetchWithAuth(`${API_BASE}/maintenance/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: commentNote, role: 'Admin/Manager' })
    }).then(res => {
      if (res.ok) {
        setCommentNote('');
        fetchTicket();
      }
    });
  };

  if (loading) return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <motion.main className="payment-content" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} transition={{duration:0.25, ease:"easeInOut"}}>
        <p>Loading...</p>
      </motion.main>
    </div>
  );

  if (!ticket) return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <motion.main className="payment-content" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} transition={{duration:0.25, ease:"easeInOut"}}>
        <p>Ticket not found</p>
      </motion.main>
    </div>
  );

  return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <motion.main className="payment-content" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} transition={{duration:0.25, ease:"easeInOut"}}>
        <header className="payment-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <p className="page-label" style={{ margin: 0 }}>TICKET #{ticket.id}</p>
                <span className={`pill-badge ${ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'pill-green' : ticket.status === 'In Progress' ? 'pill-amber' : 'pill-gray'}`} style={{ padding: '4px 12px', fontSize: '12px' }}>
                  {ticket.status}
                </span>
                <span className={`pill-badge ${(ticket.priority === 'High' || ticket.priority === 'Urgent') ? 'pill-red' : ticket.priority === 'Medium' ? 'pill-amber' : ticket.priority === 'Low' ? 'pill-green' : 'pill-gray'}`} style={{ padding: '4px 12px', fontSize: '12px' }}>
                  {ticket.priority} Priority
                </span>
              </div>
              <h1 style={{ marginTop: '4px' }}>{ticket.title}</h1>
              <p className="page-description">
                Manage ticket status, assignments, and resolution.
              </p>
            </div>
            <button onClick={() => navigate('/maintenance/complaints')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 20px', background: '#fff', color: '#17212b', border: '1px solid #e0e0e0', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
              <MdArrowBack size={16} /> Back to List
            </button>
          </header>
  
          <div className="details-grid-styled">
            <section className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2>Ticket Details</h2>
                </div>
                <span className={`status-badge ${ticket.status.replace(' ', '-').toLowerCase()}`}>
                  {ticket.status}
                </span>
              </div>
              
              <div className="ticket-body">

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                
                {/* Category Card */}
                <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <MdBuild size={24} color="#2563eb" />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Category</div>
                    <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.category?.name || 'None'}</div>
                  </div>
                </div>

                {/* Priority Card */}
                <div style={{ backgroundColor: '#fffbeb', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <MdFlag size={24} color="#d97706" />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Priority</div>
                    {ticket.status === 'Resolved' || ticket.status === 'Closed' ? (
                        <div style={{ fontSize: '16px', color: '#d97706', fontWeight: 600 }}>{ticket.priority}</div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                          <button 
                            onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                            style={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #fcd34d', 
                              borderRadius: '999px',
                              cursor: 'pointer', 
                              padding: '6px 16px', 
                              fontWeight: '600', 
                              fontFamily: 'inherit', 
                              fontSize: '14px',
                              color: '#d97706',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '180px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          >
                            <span>{ticket.priority || 'Pending Assessment'}</span>
                            <MdKeyboardArrowDown size={18} />
                          </button>

                          {isPriorityOpen && (
                            <div style={{ 
                              position: 'absolute', 
                              top: 'calc(100% + 8px)', 
                              left: 0, 
                              width: '240px',
                              backgroundColor: '#fff', 
                              borderRadius: '16px', 
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                              padding: '8px', 
                              zIndex: 50,
                              border: '1px solid #e2e8f0'
                            }}>
                              {['Pending Assessment', 'Low', 'Medium', 'High', 'Urgent'].map(opt => (
                                <div 
                                  key={opt}
                                  onClick={() => {
                                    handlePriorityChange(opt);
                                    setIsPriorityOpen(false);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#eff6ff';
                                    e.currentTarget.style.color = '#1d4ed8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = ticket.priority === opt ? '#eff6ff' : 'transparent';
                                    e.currentTarget.style.color = ticket.priority === opt ? '#1d4ed8' : '#334155';
                                  }}
                                  style={{ 
                                    padding: '12px 16px', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: ticket.priority === opt ? '#1d4ed8' : '#334155',
                                    backgroundColor: ticket.priority === opt ? '#eff6ff' : 'transparent',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                  }}
                                >
                                  {opt === 'Pending Assessment' && <MdAccessTime size={20} />}
                                  {opt === 'Low' && <MdFlag size={20} />}
                                  {opt === 'Medium' && <MdFlag size={20} />}
                                  {opt === 'High' && <MdPriorityHigh size={20} />}
                                  {opt === 'Urgent' && <MdPriorityHigh size={20} />}
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                    )}
                  </div>
                </div>

                {/* Technician Card */}
                <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <MdPerson size={24} color="#166534" />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Technician</div>
                    <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.technician?.name || 'Unassigned'}</div>
                  </div>
                </div>

                {/* Repair Cost Card */}
                <div style={{ backgroundColor: '#fef2f2', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <MdAttachMoney size={24} color="#b91c1c" />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Repair Cost</div>
                    <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>Rs. {ticket.repairCost}</div>
                  </div>
                </div>

              </div>

              {ticket.slaStatus && ticket.slaStatus !== 'On Track' && ticket.slaStatus !== 'Normal' && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                <div style={{ 
                  backgroundColor: ticket.slaStatus.toLowerCase().includes('breach') ? '#FEF2F2' : '#FFFBEB', 
                  border: `1px solid ${ticket.slaStatus.toLowerCase().includes('breach') ? '#FCA5A5' : '#FDE68A'}`, 
                  color: ticket.slaStatus.toLowerCase().includes('breach') ? '#991B1B' : '#92400E', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  marginBottom: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <span style={{ fontSize: '20px' }}>{ticket.slaStatus.toLowerCase().includes('breach') ? '\uD83D\uDEA8' : '\u26A0\uFE0F'}</span> 
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                      {ticket.slaStatus.toLowerCase().includes('breach') ? 'SLA Breached' : 'SLA Warning'}
                    </strong>
                    <span style={{ fontSize: '13px' }}>
                      This ticket is currently marked as <b>{ticket.slaStatus}</b>. Please expedite resolution to comply with service level agreements.
                    </span>
                  </div>
                </div>
              )}
              
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px 20px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdPerson size={18} color="#475569" /> Resident Information
                  </h4>
                  {ticket.residentId && (
                    <button 
                      onClick={() => navigate('/admin/residents')}
                      style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '999px', fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 14px' }}
                    >
                      <MdPerson size={16} color="#0f766e" /> View Resident Profile <MdChevronRight size={18} />
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 20px 20px' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid #e2e8f0', paddingRight: '24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#2563eb', fontWeight: '600' }}>
                      {ticket.residentName ? ticket.residentName.charAt(0).toUpperCase() : 'R'}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Resident Name</div>
                      <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{ticket.residentName || `Resident ${ticket.residentId}`}</div>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid #e2e8f0', padding: '0 24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MdHome size={24} color="#16a34a" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Apartment Unit</div>
                      <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{ticket.unitNumber || 'Unknown'}</div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MdPhone size={24} color="#2563eb" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Contact Number</div>
                      <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{ticket.residentPhone || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <MdDescription size={18} color="#475569" />
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>Description</h4>
                </div>
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #f1f5f9' }}>
                  <p style={{ margin: 0, fontSize: '15px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
                </div>
              </div>
              
              {ticket.photoPath && (
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attached Evidence</h4>
                  <div style={{ 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    border: '1px solid #E2E8F0', 
                    display: 'inline-block',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
                  }}>
                    <img 
                      src={`${MAINTENANCE_API_ORIGIN}${ticket.photoPath}`}
                      alt="Complaint evidence" 
                      style={{ display: 'block', maxWidth: '100%', maxHeight: '400px', objectFit: 'cover' }} 
                    />
                  </div>
                </div>
              )}
              

            </div>

            <div className="actions-section">
              <h3>Management Actions</h3>
              
              {ticket.status === 'Pending' && (
                <div className="action-box" style={{ background: '#fff', border: '1px solid #e3e7e3', padding: '25px' }}>
                  {!aiRecommendation ? (
                    <div>
                      <h4 style={{ margin: '0 0 10px', fontSize: '15px' }}>Smart Assignment</h4>
                      <p style={{ color: '#68727c', marginBottom: '15px', fontSize: '13.5px' }}>
                        Analyze this complaint using our Gemini AI Agent to automatically classify priority, detect SLA risks, and find the most available technician with the right skills.
                      </p>
                      <button className="ai-btn" onClick={loadAiTriage}><MdAutoAwesome size={18} /> Run AI Triage</button>
                    </div>
                  ) : aiRecommendation.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6b5ce7', fontWeight: '600' }}>
                      <MdAutoAwesome size={20} className="spin-animation" /> Analyzing complaint with Gemini AI...
                    </div>
                  ) : (aiRecommendation.error || aiRecommendation.status === 'Failed' || aiRecommendation.status === 'SafeFailure') ? (
                    <p style={{ color: 'red' }}>{aiRecommendation.error || aiRecommendation.message || 'AI triage is currently unavailable.'}</p>
                  ) : (
                    <div className="ai-result-box" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                          <MdAutoAwesome size={24} color="#6b5ce7" />
                          <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>AI TRIAGE RECOMMENDATION</h4>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                          {/* Left: Triage Data */}
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Category</span>
                              <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>{aiRecommendation.category}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Priority</span>
                              <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>{aiRecommendation.priority}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>SLA Risk</span>
                              <span style={{ fontSize: '13px', fontWeight: 700, background: aiRecommendation.slaRisk === 'High' ? '#fee2e2' : '#e0e7ff', color: aiRecommendation.slaRisk === 'High' ? '#d97706' : '#4338ca', padding: '2px 8px', borderRadius: '12px' }}>
                                {aiRecommendation.slaRisk.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Right: Technician Data */}
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>Recommended Technician</div>
                            {aiRecommendation.recommendedTechnicianId ? (
                              <>
                                <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>
                                  {recommendedTech ? recommendedTech.name : `Technician ID ${aiRecommendation.recommendedTechnicianId}`}
                                </div>
                                {recommendedTech && (
                                  <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span>Matching Skills:</span>
                                      <span style={{ fontWeight: 600 }}>{recommendedTech.skills ? recommendedTech.skills.split(',').length : 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span>Current Workload:</span>
                                      <span style={{ fontWeight: 600 }}>{recommendedTech.workload || '0'}</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>No technician available</div>
                            )}
                          </div>
                        </div>

                        {/* AI Analysis Output */}
                        {aiRecommendation.reason && (
                          <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #6b5ce7', fontSize: '13.5px', color: '#334155' }}>
                            <strong style={{ color: '#0f172a' }}>AI Analysis:</strong> {aiRecommendation.reason}
                            {aiRecommendation.technicianReason && (
                              <div style={{ marginTop: '8px' }}>
                                <strong style={{ color: '#0f172a' }}>Technician Match:</strong> {aiRecommendation.technicianReason}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Decision Buttons */}
                        {!showReviseForm ? (
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <button className="rect-btn" style={{ flex: 1, justifyContent: 'center', color: '#b91c1c', background: '#fee2e2', border: '1px solid #fca5a5' }} onClick={handleReject}>Reject</button>
                            <button className="rect-btn" style={{ flex: 1, justifyContent: 'center', color: '#334155', background: '#f1f5f9', border: '1px solid #cbd5e1' }} onClick={() => setShowReviseForm(true)}>Request Revision</button>
                            {aiRecommendation.recommendedTechnicianId && (
                              <button className="rect-btn rect-btn-dark" style={{ flex: 2, justifyContent: 'center', background: '#0f172a', color: '#fff' }} onClick={() => handleWorkflowDecision('Approve')}>
                                Approve & Assign
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '8px' }}>Feedback for AI Agent <span style={{ color: '#ef4444' }}>*</span></label>
                            <textarea 
                              value={reviseFeedback}
                              onChange={e => setReviseFeedback(e.target.value)}
                              placeholder="e.g. Please assign a different technician or reconsider the priority."
                              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', minHeight: '80px', marginBottom: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="rect-btn rect-btn-outline" onClick={() => setShowReviseForm(false)}>Cancel</button>
                              <button className="rect-btn rect-btn-dark" onClick={submitRevision}>Submit Revision</button>
                            </div>
                          </div>
                        )}

                        {/* Collapsible Audit */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                          <div 
                            onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          >
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ✨ AI Decision Audit
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                {aiRecommendation.agentSteps ? aiRecommendation.agentSteps.length : 0} agents completed · {(aiRecommendation.agentSteps?.reduce((acc, curr) => acc + (curr.durationMilliseconds || 0), 0) / 1000).toFixed(1)} sec · All validations passed
                              </div>
                            </div>
                            <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                                <MdKeyboardArrowDown size={24} style={{ transform: isWorkflowExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                              </div>
                          </div>
                          
                          {isWorkflowExpanded && (
                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {/* Swarm Workflow Logs */}
                              {aiRecommendation.agentSteps && aiRecommendation.agentSteps.map((step, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: '#334155', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ minWidth: '28px', height: '28px', borderRadius: '50%', background: step.status === 'Blocked' ? '#fee2e2' : '#dcfce7', color: step.status === 'Blocked' ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                    {step.status === 'Blocked' ? '✖' : '✓'}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                                      {step.agentRole} <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: '12px' }}>({step.durationMilliseconds}ms)</span>
                                    </div>
                                    <div style={{ marginBottom: '6px' }}><strong style={{ color: '#475569' }}>Action:</strong> {step.action}</div>
                                    {step.toolName && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px', fontFamily: 'monospace' }}>🔧 Tool: {step.toolName}</div>}
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>📥 Input: {step.inputSummary}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>📤 Output: {step.outputSummary}</div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: step.status === 'Blocked' ? '#d97706' : '#16a34a' }}>
                                      ✓ Validation: {step.validationResult}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {aiRecommendation.plan && aiRecommendation.plan.length > 0 && !aiRecommendation.agentSteps && (
                                <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {aiRecommendation.plan.map((step, idx) => (
                                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>✓</div>
                                        {step}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {ticket.status === 'Pending' && (
                  <div className="action-box" style={{ background: '#fff', border: '1px solid #e3e7e3', padding: '25px', marginTop: '16px' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '15px' }}>Manual Assignment</h4>
                    {!showManualAssign ? (
                      <>
                        <p style={{ color: '#68727c', marginBottom: '15px', fontSize: '13.5px' }}>
                          Assign this ticket to a specific available technician manually.
                        </p>
                        <button className="rect-btn" style={{ background: "#2563eb", color: "white", border: "1px solid #1d4ed8" }} onClick={loadAvailableTechs}>
                          <MdPerson size={18} style={{ marginRight: '6px' }} /> Assign Manually
                        </button>
                      </>
                    ) : (
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Select Technician</label>
                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                          <div 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{ 
                              padding: '12px 16px', 
                              border: isDropdownOpen ? '2px solid #2563eb' : '1px solid #cbd5e1', 
                              borderRadius: '8px', 
                              cursor: 'pointer',
                              background: '#fff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxShadow: isDropdownOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span style={{ fontSize: '14px', color: selectedTechId ? '#0f172a' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {selectedTechId ? (
                                <><strong style={{ fontWeight: 600 }}>{availableTechs.find(t => t.id == selectedTechId)?.name}</strong> <span style={{ color: '#64748b' }}>• {availableTechs.find(t => t.id == selectedTechId)?.skills}</span></>
                              ) : '-- Choose a Technician --'}
                            </span>
                            <MdKeyboardArrowDown size={20} style={{ color: '#94a3b8', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: '8px' }} />
                          </div>
                          
                          {isDropdownOpen && (
                            <div style={{ 
                              position: 'absolute', 
                              top: 'calc(100% + 4px)', 
                              left: 0, 
                              right: 0, 
                              background: '#fff', 
                              borderRadius: '12px', 
                              border: '1px solid #e2e8f0', 
                              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                              zIndex: 10,
                              maxHeight: '260px',
                              overflowY: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '6px'
                            }} className="custom-scrollbar">
                              <div 
                                onClick={() => { setSelectedTechId(''); setIsDropdownOpen(false); }}
                                onMouseEnter={(e) => { if (selectedTechId) e.currentTarget.style.background = '#f8fafc'; }}
                                onMouseLeave={(e) => { if (selectedTechId) e.currentTarget.style.background = 'transparent'; }}
                                style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '14px', borderRadius: '6px', marginBottom: '4px', background: !selectedTechId ? '#eff6ff' : 'transparent', color: !selectedTechId ? '#2563eb' : '#475569', fontWeight: !selectedTechId ? '600' : 'normal', transition: 'background 0.1s' }}
                              >
                                -- Choose a Technician --
                              </div>
                              {availableTechs.map(t => (
                                <div 
                                  key={t.id}
                                  onClick={() => { setSelectedTechId(t.id); setIsDropdownOpen(false); }}
                                  onMouseEnter={(e) => { if (selectedTechId != t.id) e.currentTarget.style.background = '#f8fafc'; }}
                                  onMouseLeave={(e) => { if (selectedTechId != t.id) e.currentTarget.style.background = 'transparent'; }}
                                  style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '6px', marginBottom: '2px', background: selectedTechId == t.id ? '#eff6ff' : 'transparent', transition: 'background 0.1s' }}
                                >
                                  <div style={{ fontSize: '14px', fontWeight: selectedTechId == t.id ? '600' : '500', color: selectedTechId == t.id ? '#2563eb' : '#0f172a' }}>
                                    {t.name}
                                  </div>
                                  <div style={{ fontSize: '12.5px', color: selectedTechId == t.id ? '#3b82f6' : '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {t.skills}
                                  </div>
                                </div>
                              ))}
                              {availableTechs.length === 0 && (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                                  No available technicians found.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="rect-btn rect-btn-dark" onClick={handleManualAssign} disabled={!selectedTechId}>Confirm Assignment</button>
                          <button className="rect-btn rect-btn-outline" onClick={() => setShowManualAssign(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
  
                {ticket.status === 'Assigned' && (
                  <div className="action-box" style={{ background: '#eff6ff', padding: '24px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}><MdPerson size={20} /> Technician Assigned</h4>
                    <p style={{ margin: '0 0 16px 0', color: '#1e40af', fontSize: '14px' }}>Technician <strong>{ticket.technician?.name}</strong> is assigned to this job. The next step is to start the work.</p>
                    <button className="rect-btn rect-btn-dark" style={{ background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '999px' }} onClick={handleStartWork}>
                      <MdPlayArrow size={18} /> Start Work
                    </button>
                  </div>
                )}
  
                {ticket.status === 'In Progress' && (
                  <div className="action-box" style={{ background: '#fef2f2', padding: '24px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}><MdBuild size={20} /> Work In Progress</h4>
                    <p style={{ margin: '0 0 16px 0', color: '#b91c1c', fontSize: '14px' }}>Please record the final repair cost and resolution notes to mark this ticket as resolved.</p>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      <input type="number" className="styled-input" style={{ borderColor: '#fca5a5' }} placeholder="Repair Cost (Rs.)" value={repairCost} onChange={e => setRepairCost(e.target.value)} />
                      <input type="text" className="styled-input" style={{ flex: 1, borderColor: '#fca5a5' }} placeholder="Resolution Note" value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                    <button className="rect-btn rect-btn-dark" style={{ background: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '999px' }} onClick={handleResolve}>
                      <MdCheckCircle size={18} /> Resolve Ticket
                    </button>
                  </div>
                )}
  
                {ticket.status === 'Resolved' && (
                  <div className="action-box" style={{ background: '#f0fdf4', padding: '24px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}><MdCheckCircle size={20} /> Ticket Resolved</h4>
                    <p style={{ margin: '0 0 16px 0', color: '#15803d', fontSize: '14px' }}>Ticket is marked as resolved. Cost: <strong>Rs. {ticket.repairCost}</strong>.<br/>
                    <small style={{ display: 'block', marginTop: '4px', opacity: 0.8 }}>Normally, the resident verifies this in the mobile app. You can override and close the ticket here.</small></p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="rect-btn rect-btn-dark" style={{ background: '#16a34a', color: '#fff', padding: '10px 20px', borderRadius: '999px' }} onClick={handleClose}>
                        <MdClose size={18} /> Close Ticket (Override)
                      </button>
                    </div>
                  </div>
                )}

              {ticket.status === 'Closed' && (
                <p className="closed-notice" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdCheckCircle size={20} /> This ticket is closed and verified.</p>
              )}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <h2>Timeline & Comments</h2>
              </div>
            </div>
            <div className="history-timeline" style={{ position: 'relative', paddingLeft: '48px' }}>
                <div style={{ position: 'absolute', left: '23px', top: '24px', bottom: '24px', width: '2px', background: '#e2e8f0' }}></div>
                {(ticket.history || []).map(h => {
                  let icon = <MdAutoAwesome size={14} color="#fff" />;
                  let bg = '#64748b';
                  if (h.status === 'Resolved' || h.status === 'Closed') { icon = <MdCheckCircle size={14} color="#fff" />; bg = '#10b981'; }
                  else if (h.status === 'Assigned') { icon = <MdPerson size={14} color="#fff" />; bg = '#3b82f6'; }
                  else if (h.status === 'Priority Updated') { icon = <MdPriorityHigh size={14} color="#fff" />; bg = '#f59e0b'; }
                  else if (h.status === 'Complaint Created') { icon = <MdAutoAwesome size={14} color="#fff" />; bg = '#6366f1'; }
                  else if (h.status === 'Comment Added' || (h.note && h.note.toLowerCase().includes('comment'))) { icon = <MdComment size={14} color="#fff" />; bg = '#8b5cf6'; }
                  else if (h.status === 'Pending') { icon = <MdAccessTime size={14} color="#fff" />; bg = '#f59e0b'; }
                  
                  return (
                    <div key={h.id} className="history-item" style={{ position: 'relative', marginBottom: '24px' }}>
                      <div style={{ position: 'absolute', left: '-42px', top: '8px', width: '28px', height: '28px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', zIndex: 2 }}>
                        {icon}
                      </div>
                      <div className="history-content" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>{h.status}</h4>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                                                {(() => {
                          const match = h.note ? h.note.match(/^\[Rating: (\d)\/5 Stars\]\s*(.*)$/is) : null;
                          let rating = null;
                          let cleanNote = h.note;
                          if (match) {
                            rating = parseInt(match[1], 10);
                            cleanNote = match[2];
                          }
                          return (
                            <>
                              {rating !== null && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', gap: '2px' }}>
                                    {[...Array(5)].map((_, i) => (
                                      <MdStar key={i} size={18} color={i < rating ? '#f5c518' : '#e2e8f0'} />
                                    ))}
                                  </div>
                                  <span style={{ fontWeight: 'bold', color: '#f5c518', fontSize: '13px' }}>{rating}/5 Stars</span>
                                </div>
                              )}
                              {cleanNote && <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0033a0', fontWeight: 'bold' }}>{cleanNote}</p>}
                            </>
                          );
                        })()}
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>By: {h.changedBy}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            
            <div style={{ marginTop: '20px', borderTop: '1px solid #e8ebe7', paddingTop: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="styled-input" 
                  style={{flex: 1}} 
                  placeholder="Type a comment or update..." 
                  value={commentNote} 
                  onChange={e => setCommentNote(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <button className="action-btn-dark" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleAddComment}>
                  <MdComment size={18} /> Post
                </button>
              </div>
            </div>
          </section>
        </div>
      </motion.main>
    </div>
  );
}

export default MaintenanceDetails;












