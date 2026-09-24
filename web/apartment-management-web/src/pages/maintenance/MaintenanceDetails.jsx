import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdAutoAwesome, MdPlayArrow, MdCheckCircle, MdAssignmentInd, MdClose, MdComment, MdArrowBack } from 'react-icons/md';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
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

  const fetchTicket = () => {
    fetch(`http://localhost:5073/api/maintenance/${id}`)
      .then(res => res.json())
      .then(data => {
        setTicket(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const loadAiTriage = () => {
    setAiRecommendation({ loading: true });
    fetch(`http://localhost:5073/api/maintenance/${id}/triage`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setAiRecommendation(data))
      .catch(err => {
        console.error(err);
        setAiRecommendation({ error: 'Failed to load AI recommendation.' });
      });
  };

  const handleAssign = () => {
    if (!aiRecommendation?.recommendedTechnicianId) {
        alert('Please get AI recommendation first to know who to assign.');
        return;
    }
    fetch(`http://localhost:5073/api/maintenance/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId: aiRecommendation.recommendedTechnicianId })
    }).then(res => res.ok && fetchTicket());
  };

  const handleStartWork = () => {
    fetch(`http://localhost:5073/api/maintenance/${id}/start`, { method: 'POST' })
      .then(res => res.ok && fetchTicket());
  };

  const handleResolve = () => {
    fetch(`http://localhost:5073/api/maintenance/${id}/resolve`, {
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
    fetch(`http://localhost:5073/api/maintenance/${id}/verify`, {
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
    fetch(`http://localhost:5073/api/maintenance/${id}/comments`, {
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
      <main className="payment-content">
        <p>Loading...</p>
      </main>
    </div>
  );

  if (!ticket) return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <main className="payment-content">
        <p>Ticket not found</p>
      </main>
    </div>
  );

  return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <main className="payment-content">
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
              {ticket.slaStatus && ticket.slaStatus !== 'On Track' && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fc8181', color: '#c53030', padding: '12px 15px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500', fontSize: '14px' }}>
                  <span style={{ fontSize: '18px' }}>⚠️</span> 
                  SLA WARNING: This ticket is currently {ticket.slaStatus.toUpperCase()}.
                </div>
              )}
              <p className="ticket-desc">{ticket.description}</p>
              
              {ticket.photoPath && (
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <p className="meta-label">Attached Photo:</p>
                  <img 
                    src={`http://localhost:5073${ticket.photoPath}`} 
                    alt="Complaint attachment" 
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #dfe2dd' }} 
                  />
                </div>
              )}
              
              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Category</span>
                  <span className="meta-value">{ticket.category?.name || 'Unknown'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Priority</span>
                  <span className={`status-badge ${ticket.priority.toLowerCase()}`} style={{width: 'fit-content'}}>{ticket.priority}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Technician</span>
                  <span className="meta-value">{ticket.technician?.name || 'Unassigned'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Repair Cost</span>
                  <span className="meta-value">Rs. {ticket.repairCost}</span>
                </div>
              </div>
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
                        <div>
                          <span className="ai-badge" style={{ background: '#d4edda', color: '#155724' }}>TECHNICIAN MATCH</span>
                          <p style={{ margin: 0, fontSize: '14px' }}>
                            {aiRecommendation.recommendedTechnicianId ? (
                              <><strong>Recommended:</strong> Technician ID {aiRecommendation.recommendedTechnicianId}</>
                            ) : (
                              <strong>No technicians available with matching skills.</strong>
                            )}
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4a5568' }}>{aiRecommendation.technicianReason}</p>
                        </div>
                        
                        {aiRecommendation.recommendedTechnicianId && (
                          <button className="action-btn-dark" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleAssign}>
                            <MdAssignmentInd size={18} /> Approve Assignment
                          </button>
                        )}
                      </div>
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
      </main>
    </div>
  );
}

export default MaintenanceDetails;
