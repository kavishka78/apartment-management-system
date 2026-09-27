import { useState, useEffect } from 'react';
import { MdWarning, MdArrowForward, MdCheckCircle } from 'react-icons/md';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import '../payment/PaymentDashboard.css';

function SlaRisk() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5073/api/maintenance')
      .then(res => res.json())
      .then(data => {
        setRisks(data.filter(c => c.status !== 'Resolved' && c.status !== 'Closed' && (c.slaStatus === 'At Risk' || c.slaStatus === 'Overdue')));
        setLoading(false);
      });
  }, []);

  return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <main className="payment-content">
        <header className="payment-header">
          <div>
            <p className="page-label">PERFORMANCE</p>
            <h1>SLA Risk Board</h1>
            <p className="page-description">Monitor tickets that are approaching or past their resolution deadlines.</p>
          </div>
        </header>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>At-Risk Tickets</h2>
              <p style={{ margin: '5px 0 0', color: '#68727c', fontSize: '13px' }}>Requires immediate management attention.</p>
            </div>
          </div>
          
          {risks.length === 0 && !loading ? (
            <div className="empty-state" style={{ padding: '60px 20px', borderTop: '1px solid #e3e7e3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MdCheckCircle size={48} color="#48bb78" style={{ marginBottom: '15px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#3d4852' }}>No SLA risks!</h3>
              <p style={{ margin: 0, color: '#8a949e', fontSize: '13.5px' }}>All active tickets are on track.</p>
            </div>
          ) : (
            <div className="table-wrapper"><table className="payment-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>SLA Due Date</th>
                  <th>Risk Level</th>
                  <th>Technician</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {risks.map(r => (
                  <tr key={r.id}>
                    <td><strong style={{color: '#2d3748'}}>{r.title}</strong></td>
                    <td>{new Date(r.slaDueDate).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: r.slaStatus === 'Overdue' ? '#e53e3e' : '#dd6b20', fontWeight: 'bold' }}>
                        <MdWarning size={16} /> {r.slaStatus.toUpperCase()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: '12px', fontWeight: 'bold' }}>
                          {r.technician?.name ? r.technician.name.charAt(0) : '?'}
                        </div>
                        {r.technician?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td>
                      <button className="primary-btn" style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: r.slaStatus === 'Overdue' ? '#e53e3e' : '#dd6b20' }} onClick={() => window.location.href=`/maintenance/${r.id}`}>
                        Escalate <MdArrowForward size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </section>
      </main>
    </div>
  );
}

export default SlaRisk;
