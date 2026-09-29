import { useState, useEffect, useCallback } from 'react';
import { getAuthToken } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { MdAutoAwesome, MdPlayArrow, MdCheckCircle, MdClose, MdComment, MdArrowBack, MdBuild, MdFlag, MdPerson, MdAttachMoney, MdPhone, MdHome } from 'react-icons/md';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import { motion } from 'framer-motion';
import '../payment/PaymentDashboard.css';
import './MaintenanceDetails.css';

function MaintenanceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  // For resolution and comments
  const [repairCost, setRepairCost] = useState('');
  const [note, setNote] = useState('');
  const [commentNote, setCommentNote] = useState('');

const fetchWithAuth = useCallback((url, options = {}) => {
    const token = getAuthToken();
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  }, []);

  const fetchTicket = useCallback(() => {
    fetchWithAuth(`http://localhost:5073/api/maintenance/${id}`)
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
      fetchWithAuth(`http://localhost:5073/api/technicians/${aiRecommendation.recommendedTechnicianId}`)
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
    fetchWithAuth(`http://localhost:5073/api/maintenance/${id}/triage`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setAiRecommendation(data))
      .catch(err => {
        console.error(err);
        setAiRecommendation({ error: 'Failed to load AI recommendation.' });
      });
  };

    const submitRevision = () => {
    if (!reviseFeedback.trim()) {
        alert('Please enter your feedback for the AI Agent.');
        return;
    }
    
    // Mark old workflow as revised first
    if (aiRecommendation?.workflowId) {
      fetchWithAuth(`http://localhost:5073/api/maintenance/workflows/${aiRecommendation.workflowId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'RequestRevision', note: reviseFeedback, approvedBy: 'Manager' })
      });
    }

    setAiRecommendation(null);
    setShowReviseForm(false);
    fetchWithAuth(`http://localhost:5073/api/maintenance/${id}/revise`, {
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
      fetchWithAuth(`http://localhost:5073/api/maintenance/workflows/${aiRecommendation.workflowId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'Reject', note: 'Rejected by manager', approvedBy: 'Manager' })
      });
    }

    setAiRecommendation(null);
    fetchWithAuth(`http://localhost:5073/api/maintenance/${id}/reject`, {
      method: 'POST'
    })
    .then(res => {
        if (res.ok) fetchTicket();
    });
  };

  const handleWorkflowDecision = (decision) => {
    if (!aiRecommendation?.workflowId) {
      alert('Run AI triage before making an approval decision.');
      return;
    }
    fetchWithAuth(`http://localhost:5073/api/maintenance/workflows/${aiRecommendation.workflowId}/approval`, {
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

  const handleStartWork = () => {
    fetchWithAuth(`http://localhost:5073/api/maintenance/${id}/start`, { method: 'POST' })
      .then(res => res.ok && fetchTicket());
  };

  const handleResolve = () => {
    fetchWithAuth(`http://localhost:5073/api/maintenance/${id}/resolve`, {
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
    fetchWithAuth(`http://localhost:5073/api/maintenance/${id}/verify`, {
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
    fetchWithAuth(`http://localhost:5073/api/maintenance/${id}/comments`, {
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
            <p className="page-label">TICKET #{ticket.id}</p>
            <h1>{ticket.title}</h1>
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

              <div className="md-info-grid">
                <div className="md-info-box md-info-blue">
                  <MdBuild className="md-info-icon" />
                  <div>
                    <div className="md-info-label">Category</div>
                    <div className="md-info-value">{ticket.category?.name || 'None'}</div>
                  </div>
                </div>
                <div className="md-info-box md-info-yellow">
                  <MdFlag className="md-info-icon" />
                  <div>
                    <div className="md-info-label">Priority</div>
                    <div className="md-info-value md-text-yellow">{ticket.priority}</div>
                  </div>
                </div>
                <div className="md-info-box md-info-green">
                  <MdPerson className="md-info-icon" />
                  <div>
                    <div className="md-info-label">Technician</div>
                    <div className="md-info-value">{ticket.technician?.name || 'Unassigned'}</div>
                  </div>
                </div>
                <div className="md-info-box md-info-red">
                  <MdAttachMoney className="md-info-icon" />
                  <div>
                    <div className="md-info-label">Repair Cost</div>
                    <div className="md-info-value">Rs. {ticket.repairCost}</div>
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
              
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '24px', gap: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#1D4ED8', fontWeight: '600', flexShrink: 0 }}>
                  {ticket.residentName ? ticket.residentName.charAt(0).toUpperCase() : 'R'}
                </div>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Resident Name</div>
                    <div style={{ fontSize: '16px', color: '#0F172A', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}><MdPerson color="#94A3B8" size={18} /> {ticket.residentName || `Resident ${ticket.residentId}`}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Apartment Unit</div>
                    <div style={{ fontSize: '16px', color: '#0F172A', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}><MdHome color="#94A3B8" size={18} /> {ticket.unitNumber || 'Unknown'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Contact Number</div>
                    <div style={{ fontSize: '16px', color: '#0F172A', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}><MdPhone color="#94A3B8" size={18} /> {ticket.residentPhone || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px', overflow: 'hidden' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</h4>
                <p style={{ margin: 0, fontSize: '15px', color: '#1E293B', lineHeight: '1.6', wordWrap: 'break-word', wordBreak: 'break-all', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
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
                      src={`http://localhost:5073${ticket.photoPath}`} 
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
                  ) : aiRecommendation.error ? (
                    <p style={{ color: 'red' }}>{aiRecommendation.error}</p>
                  ) : (
                    <div className="ai-result-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                        <MdAutoAwesome size={22} color="#6b5ce7" />
                        <h4 style={{ margin: 0, color: '#2d3748', fontSize: '16px' }}>AI Triage Recommendation</h4>
                      </div>
                      
                                            {aiRecommendation.agentSteps && aiRecommendation.agentSteps.length > 0 ? (
                        <div style={{ marginBottom: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#4a5568', fontSize: '14px' }}>AGENTIC AI SWARM WORKFLOW</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {aiRecommendation.agentSteps.map((step, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#2d3748', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <div style={{ minWidth: '24px', height: '24px', borderRadius: '50%', background: step.status === 'Blocked' ? '#fee2e2' : '#d4edda', color: step.status === 'Blocked' ? '#991b1b' : '#155724', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                  {step.status === 'Blocked' ? '❌' : '✅'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', color: '#4a5568', marginBottom: '2px' }}>{step.agentRole} <span style={{ fontWeight: 'normal', color: '#718096', fontSize: '12px' }}>({step.durationMilliseconds}ms)</span></div>
                                  <div style={{ marginBottom: '4px' }}><strong>Action:</strong> {step.action}</div>
                                  {step.toolName && <div style={{ fontSize: '12px', color: '#718096', marginBottom: '2px' }}>🔧 Tool: {step.toolName}</div>}
                                  <div style={{ fontSize: '12px', color: '#718096', marginBottom: '2px' }}>📥 Input: {step.inputSummary}</div>
                                  <div style={{ fontSize: '12px', color: '#718096', marginBottom: '2px' }}>📤 Output: {step.outputSummary}</div>
                                  <div style={{ fontSize: '12px', color: step.status === 'Blocked' ? '#e53e3e' : '#38a169' }}>✅ Validation: {step.validationResult}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : aiRecommendation.plan && aiRecommendation.plan.length > 0 && (
                        <div style={{ marginBottom: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#4a5568', fontSize: '14px' }}>AGENTIC AI WORKFLOW PLAN</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {aiRecommendation.plan.map((step, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#2d3748' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#d4edda', color: '#155724', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>Ã¢Å“â€œ</div>
                                {step}
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '12.5px', color: '#64748b' }}>
                            <strong>Tools Used:</strong> {aiRecommendation.toolResults || 'Standard tools'}
                            <br/>
                            <strong>✅ Validation:</strong> {aiRecommendation.validationResults || 'Passed'}
                          </div>
                          {aiRecommendation.agentSteps?.length > 0 && (
                            <div style={{ marginTop: '12px', fontSize: '12.5px', color: '#475569' }}>
                              <strong>Auditable agent roles:</strong>
                              {aiRecommendation.agentSteps.map(step => (
                                <div key={`${step.sequence}-${step.agentRole}`} style={{ marginTop: '5px' }}>
                                  {step.sequence}. {step.agentRole}: {step.action} ({step.status})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                          <span className="ai-badge">CLASSIFICATION</span>
                          <p style={{ margin: 0, fontSize: '14px' }}><strong>Category:</strong> {aiRecommendation.category}</p>
                          <p style={{ margin: '5px 0 0', fontSize: '14px' }}><strong>Priority:</strong> {aiRecommendation.priority}</p>
                        </div>
                        <div>
                          <span className="ai-badge" style={{ background: aiRecommendation.slaRisk === 'High' ? '#ffe2e5' : '#e2d9ff', color: aiRecommendation.slaRisk === 'High' ? '#e63946' : '#6b5ce7' }}>SLA RISK: {aiRecommendation.slaRisk.toUpperCase()}</span>
                          <p style={{ margin: 0, fontSize: '13px', color: '#4a5568' }}>{aiRecommendation.slaReason}</p>
                        </div>
                      </div>
                      
                      <p style={{ fontSize: '13.5px', color: '#4a5568', background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2d9ff' }}>
                        <strong>Analysis:</strong> {aiRecommendation.reason}
                      </p>
                      
                      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2d9ff' }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                          <span className="ai-badge" style={{ background: '#d4edda', color: '#155724', marginBottom: '8px', display: 'inline-block' }}>TECHNICIAN MATCH</span>
                          
                          {aiRecommendation.recommendedTechnicianId ? (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14.5px', color: '#1f2937', fontWeight: 600 }}>
                                <MdPerson size={18} style={{ color: '#4b5563' }} />
                                {recommendedTech ? recommendedTech.name : `Technician ID ${aiRecommendation.recommendedTechnicianId}`}
                              </div>
                              
                              {recommendedTech && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', marginLeft: '24px' }}>
                                  
                                  {/* Contact Info */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563' }}>
                                    <MdPhone size={14} style={{ color: '#6b7280' }} />
                                    <span>{recommendedTech.contactInformation || 'N/A'}</span>
                                  </div>
                                  
                                  {/* Skills Badges */}
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                    <MdBuild size={14} style={{ color: '#6b7280', marginTop: '2px' }} />
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {recommendedTech.skills ? recommendedTech.skills.split(',').map(skill => (
                                        <span key={skill} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500, border: '1px solid #e2e8f0' }}>
                                          {skill.trim()}
                                        </span>
                                      )) : <span style={{ fontSize: '12.5px', color: '#64748b' }}>N/A</span>}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* AI Reasoning Box */}
                              <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8fafc', borderLeft: '3px solid #94a3b8', borderRadius: '0 6px 6px 0', fontSize: '13px', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <MdAutoAwesome size={16} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
                                <span>{aiRecommendation.technicianReason}</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginTop: '10px' }}>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>No technicians available with matching skills.</p>
                              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#4a5568' }}>{aiRecommendation.technicianReason}</p>
                            </div>
                          )}
                        </div>
                        
                        {aiRecommendation.recommendedTechnicianId && (
                          <button className="action-btn-dark" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleWorkflowDecision('Approve')}>
                            Approve & Assign
                          </button>
                        )}
                      </div>
                      {!showReviseForm ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button className="action-btn-dark" style={{ background: '#6b7280' }} onClick={() => setShowReviseForm(true)}>Request Revision</button>
                          <button className="action-btn-dark" style={{ background: '#b91c1c' }} onClick={handleReject}>Reject</button>
                        </div>
                      ) : (
                        <div style={{ marginTop: '16px', background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Feedback for AI Agent <span style={{ color: '#b91c1c' }}>*</span></label>
                          <textarea 
                            value={reviseFeedback}
                            onChange={e => setReviseFeedback(e.target.value)}
                            placeholder="e.g. Please assign a different technician or reconsider the priority."
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical', minHeight: '80px', marginBottom: '10px', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="action-btn-dark" style={{ background: '#6b7280' }} onClick={() => setShowReviseForm(false)}>Cancel</button>
                            <button className="action-btn-dark" style={{ background: '#2563eb' }} onClick={submitRevision}>Submit Revision</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {ticket.status === 'Assigned' && (
                <div className="action-box">
                  <p>Technician {ticket.technician?.name} is assigned.</p>
                  <button className="action-btn-dark" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleStartWork}>
                    <MdPlayArrow size={18} /> Start Work
                  </button>
                </div>
              )}

              {ticket.status === 'In Progress' && (
                <div className="action-box">
                  <p>Record repair cost and resolution notes.</p>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input type="number" className="styled-input" placeholder="Repair Cost (Rs.)" value={repairCost} onChange={e => setRepairCost(e.target.value)} />
                    <input type="text" className="styled-input" style={{flex: 1}} placeholder="Resolution Note" value={note} onChange={e => setNote(e.target.value)} />
                  </div>
                  <button className="action-btn-dark" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleResolve}>
                    <MdCheckCircle size={18} /> Resolve Ticket
                  </button>
                </div>
              )}

              {ticket.status === 'Resolved' && (
                <div className="action-box">
                  <p>Ticket is marked as resolved by technician. Cost: Rs. {ticket.repairCost}.<br/>
                  <small style={{color: '#68727c'}}>Normally, the resident verifies this in the mobile app. You can override and close the ticket here.</small></p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="action-btn-dark" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleClose}>
                      <MdClose size={18} /> Close Ticket (Override)
                    </button>
                  </div>
                </div>
              )}

              {ticket.status === 'Closed' && (
                <p className="closed-notice">This ticket is closed and verified.</p>
              )}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <h2>Timeline & Comments</h2>
              </div>
            </div>
            <div className="history-timeline">
              {ticket.history.map(h => (
                <div key={h.id} className="history-item">
                  <div className="history-dot"></div>
                  <div className="history-content">
                    <span className="history-date">{new Date(h.createdAt).toLocaleString()}</span>
                    <h4>{h.status}</h4>
                    <p>{h.note}</p>
                    <span className="history-by">By: {h.changedBy}</span>
                  </div>
                </div>
              ))}
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







