import { useState, useEffect } from 'react';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import '../payment/PaymentDashboard.css'; // Reuse existing styles

function MaintenanceDashboard() {
  const [report, setReport] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5073/api/reports/maintenance').then(r => r.json()),
      fetch('http://localhost:5073/api/maintenance').then(r => r.json())
    ])
    .then(([reportData, maintenanceData]) => {
      setReport(reportData);
      setRecentComplaints(maintenanceData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="payment-page">
      <MaintenanceSidebar />

      <main className="payment-content">
        <header className="payment-header">
          <div>
            <p className="page-label">ADMIN PORTAL</p>
            <h1>Maintenance Dashboard</h1>
            <p className="page-description">
              Monitor complaints, assignments, and resolution progress.
            </p>
          </div>
        </header>

        <section className="summary-grid">
          <div className="summary-card">
            <p>Total Complaints</p>
            <h2>{loading ? "..." : report?.total ?? 0}</h2>
            <span>All recorded issues</span>
          </div>

          <div className="summary-card">
            <p>Pending / Assigned</p>
            <h2>{loading ? "..." : ((report?.pending ?? 0) + (report?.assigned ?? 0))}</h2>
            <span>Requires action</span>
          </div>

          <div className="summary-card">
            <p>In Progress</p>
            <h2>{loading ? "..." : report?.inProgress ?? 0}</h2>
            <span>Currently being fixed</span>
          </div>

          <div className="summary-card">
            <p>SLA Risks</p>
            <h2>{loading ? "..." : report?.slaRiskCount ?? 0}</h2>
            <span>Approaching deadline</span>
          </div>
        </section>

        <section className="dashboard-panel" style={{ marginTop: '30px' }}>
          <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2>Recent Complaints</h2>
              <p style={{ margin: '6px 0 0', color: '#68727c', fontSize: '13.5px' }}>Latest complaint activity from residents.</p>
            </div>
            <button onClick={() => window.location.href='/maintenance/complaints'} style={{ padding: '8px 20px', border: 'none', borderRadius: '50px', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'}>View All</button>
          </div>
          
          {recentComplaints.length === 0 && !loading ? (
            <div className="empty-state" style={{ padding: '50px 20px', borderTop: '1px solid #e3e7e3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#3d4852' }}>No complaints yet</h3>
              <p style={{ margin: 0, color: '#8a949e', fontSize: '13.5px' }}>Resident complaint activity will appear here.</p>
            </div>
          ) : (
            <div className="table-wrapper"><table className="payment-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map(c => (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td><span className={`status-badge ${c.status.toLowerCase().replace(' ', '-')}`}>{c.status}</span></td>
                    <td><span className={`status-badge ${c.priority.toLowerCase()}`}>{c.priority}</span></td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button style={{ padding: '6px 16px', background: '#17212b', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'} onClick={() => window.location.href=`/maintenance/complaints/${c.id}`}>View</button>
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

export default MaintenanceDashboard;
