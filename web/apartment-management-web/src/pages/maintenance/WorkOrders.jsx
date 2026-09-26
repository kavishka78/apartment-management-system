import { useState, useEffect } from 'react';
import { MdAssignment, MdPlayArrow, MdCheckCircle } from 'react-icons/md';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import '../payment/PaymentDashboard.css';

function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5073/api/maintenance')
      .then(res => res.json())
      .then(data => {
        setOrders(data.filter(c => c.status === 'Assigned' || c.status === 'In Progress' || c.status === 'Resolved'));
        setLoading(false);
      });
  }, []);

  return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <main className="payment-content">
        <header className="payment-header">
          <div>
            <p className="page-label">TECHNICIAN & WORK</p>
            <h1>Work Orders</h1>
            <p className="page-description">Manage active maintenance assignments.</p>
          </div>
        </header>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Active Work Orders</h2>
              <p style={{ margin: '5px 0 0', color: '#68727c', fontSize: '13px' }}>Track jobs currently assigned to technicians.</p>
            </div>
          </div>
          
          {orders.length === 0 && !loading ? (
            <div className="empty-state" style={{ padding: '60px 20px', borderTop: '1px solid #e3e7e3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MdAssignment size={48} color="#cbd5e0" style={{ marginBottom: '15px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#3d4852' }}>No active work orders</h3>
              <p style={{ margin: 0, color: '#8a949e', fontSize: '13.5px' }}>Assigned jobs will appear here.</p>
            </div>
          ) : (
            <div className="table-wrapper"><table className="payment-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Technician</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>SLA Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong style={{color: '#2d3748'}}>{o.title}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: '12px', fontWeight: 'bold' }}>
                          {o.technician?.name ? o.technician.name.charAt(0) : '?'}
                        </div>
                        {o.technician?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td><span className={`status-badge ${o.status.toLowerCase().replace(' ', '-')}`}>{o.status}</span></td>
                    <td><span className={`status-badge ${o.priority.toLowerCase()}`}>{o.priority}</span></td>
                    <td>
                      {o.slaStatus === 'At Risk' || o.slaStatus === 'Overdue' ? (
                        <span style={{ color: '#e53e3e', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {o.slaDueDate ? new Date(o.slaDueDate).toLocaleDateString() : 'N/A'}</span>
                      ) : (
                        <span style={{ color: '#4a5568' }}>{o.slaDueDate ? new Date(o.slaDueDate).toLocaleDateString() : 'N/A'}</span>
                      )}
                    </td>
                    <td>
                      <button className="primary-btn" style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => window.location.href=`/maintenance/${o.id}`}>
                        {o.status === 'Assigned' ? <MdPlayArrow size={14}/> : o.status === 'In Progress' ? <MdCheckCircle size={14}/> : 'Manage'} 
                        {o.status === 'Assigned' ? 'Start' : o.status === 'In Progress' ? 'Resolve' : 'View'}
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

export default WorkOrders;
