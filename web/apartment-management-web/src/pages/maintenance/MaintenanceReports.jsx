import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import '../payment/PaymentDashboard.css';
import '../payment/CollectionReports.css';

function MaintenanceReports() {
  const [report, setReport] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5073/api/reports/maintenance').then(r => r.json()),
      fetch('http://localhost:5073/api/maintenance').then(r => r.json())
    ]).then(([reportData, ticketsData]) => {
      setReport(reportData);
      setTickets(ticketsData);
      setLoading(false);
    });
  }, []);

  const [timeFilter, setTimeFilter] = useState('month'); // 'day', 'month', 'year'

  // Process data for charts
  const chartData = useMemo(() => {
    if (!tickets.length) return [];
    
    const dataMap = {};
    
    if (timeFilter === 'day') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        dataMap[dayStr] = { name: dayStr, Complaints: 0, Resolved: 0, Cost: 0 };
      }
    } else if (timeFilter === 'year') {
      // Last 4 years
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setFullYear(d.getFullYear() - i);
        const yearStr = d.getFullYear().toString();
        dataMap[yearStr] = { name: yearStr, Complaints: 0, Resolved: 0, Cost: 0 };
      }
    } else {
      // Last 6 months (default)
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = d.toLocaleString('default', { month: 'short' });
        dataMap[monthStr] = { name: monthStr, Complaints: 0, Resolved: 0, Cost: 0 };
      }
    }

    tickets.forEach(t => {
      const d = new Date(t.createdAt);
      const keyStr = timeFilter === 'day' 
        ? d.toLocaleDateString('default', { month: 'short', day: 'numeric' })
        : timeFilter === 'year' 
        ? d.getFullYear().toString()
        : d.toLocaleString('default', { month: 'short' });
      
      if (dataMap[keyStr]) {
        dataMap[keyStr].Complaints += 1;
        if (t.status === 'Resolved' || t.status === 'Closed') {
          dataMap[keyStr].Resolved += 1;
        }
        if (t.repairCost) {
          dataMap[keyStr].Cost += t.repairCost;
        }
      }
    });

    return Object.values(dataMap);
  }, [tickets, timeFilter]);

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <div className="payment-page">
        <MaintenanceSidebar />
        <main className="payment-content">
          <header className="payment-header">
            <div>
              <p className="page-label">ANALYTICS</p>
              <h1>Maintenance Reports</h1>
            </div>
          </header>
          <div className="reports-loading">Loading report...</div>
        </main>
      </div>
    );
  }

  const resolvedTotal = (report?.resolved || 0) + (report?.closed || 0);
  const resolutionRate = calculatePercentage(resolvedTotal, report?.total);
  const inProgressRate = calculatePercentage(report?.inProgress, report?.total);
  const pendingRate = calculatePercentage((report?.pending || 0) + (report?.assigned || 0), report?.total);
  const slaRiskRate = calculatePercentage(report?.slaRiskCount, report?.total);

  return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <main className="payment-content">
        <header className="payment-header">
          <div>
            <p className="page-label">ANALYTICS</p>
            <h1>Maintenance Reports</h1>
            <p className="page-description">Review ticket totals, resolution performance and outstanding issues.</p>
          </div>
          <button onClick={() => window.print()} style={{ alignSelf: 'center', height: 'fit-content', padding: '10px 24px', border: 'none', borderRadius: '50px', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'}>
            Download PDF
          </button>
        </header>

        <section className="report-summary-grid">
          <div className="report-summary-card">
            <p>Total Complaints</p>
            <h2>{report?.total ?? 0}</h2>
            <span>All recorded issues</span>
          </div>

          <div className="report-summary-card">
            <p>Total Repair Costs</p>
            <h2>Rs. {Number(report?.totalRepairCost || 0).toLocaleString()}</h2>
            <span>Accumulated cost</span>
          </div>

          <div className="report-summary-card">
            <p>Pending / Assigned</p>
            <h2>{(report?.pending || 0) + (report?.assigned || 0)}</h2>
            <span>{pendingRate}% of total tickets</span>
          </div>

          <div className="report-summary-card">
            <p>SLA Risk Accounts</p>
            <h2>{report?.slaRiskCount ?? 0}</h2>
            <span>{slaRiskRate}% of all tickets</span>
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
          <div className="dashboard-panel" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 5px' }}>Complaint Volume Trends</h3>
                <p style={{ margin: 0, color: '#68727c', fontSize: '13px' }}>Total vs Resolved complaints.</p>
              </div>
              <div style={{ display: 'flex', background: '#f1f3f5', borderRadius: '50px', padding: '4px' }}>
                <button 
                  onClick={() => setTimeFilter('day')}
                  style={{ background: timeFilter === 'day' ? '#fff' : 'transparent', color: timeFilter === 'day' ? '#17212b' : '#68727c', border: 'none', borderRadius: '50px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: timeFilter === 'day' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >Day</button>
                <button 
                  onClick={() => setTimeFilter('month')}
                  style={{ background: timeFilter === 'month' ? '#fff' : 'transparent', color: timeFilter === 'month' ? '#17212b' : '#68727c', border: 'none', borderRadius: '50px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: timeFilter === 'month' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >Month</button>
                <button 
                  onClick={() => setTimeFilter('year')}
                  style={{ background: timeFilter === 'year' ? '#fff' : 'transparent', color: timeFilter === 'year' ? '#17212b' : '#68727c', border: 'none', borderRadius: '50px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: timeFilter === 'year' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >Year</button>
              </div>
            </div>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#68727c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#68727c' }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Complaints" stroke="#8884d8" fillOpacity={1} fill="url(#colorComplaints)" />
                  <Area type="monotone" dataKey="Resolved" stroke="#82ca9d" fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-panel" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 5px' }}>Repair Costs by Month</h3>
              <p style={{ margin: 0, color: '#68727c', fontSize: '13px' }}>Accumulated expenses for maintenance.</p>
            </div>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#68727c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#68727c' }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                  <Tooltip formatter={(value) => `Rs. ${value}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="Cost" fill="#ffc658" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="collection-overview-panel">
          <div className="collection-overview-header">
            <div>
              <h2>Resolution Overview</h2>
              <p>Current maintenance and repair performance.</p>
            </div>
          </div>

          <div className="collection-rate-section">
            <div className="collection-rate-top">
              <div>
                <p>Overall Resolution Rate</p>
                <h3>{resolutionRate}%</h3>
              </div>
              <div className="collection-rate-values">
                <span>Resolved <strong>{resolvedTotal}</strong></span>
                <span>Total <strong>{report?.total}</strong></span>
              </div>
            </div>
            <div className="report-progress">
              <div className="report-progress-fill" style={{ width: `${Math.min(resolutionRate, 100)}%`, backgroundColor: '#4CAF50' }} />
            </div>
          </div>

          <div className="invoice-report-grid">
            <div className="invoice-report-item paid">
              <div>
                <p>Resolved & Closed</p>
                <h3>{resolvedTotal}</h3>
              </div>
              <span>{resolutionRate}%</span>
            </div>

            <div className="invoice-report-item pending">
              <div>
                <p>In Progress</p>
                <h3>{report?.inProgress ?? 0}</h3>
              </div>
              <span>{inProgressRate}%</span>
            </div>

            <div className="invoice-report-item overdue">
              <div>
                <p>Pending / Assigned</p>
                <h3>{(report?.pending || 0) + (report?.assigned || 0)}</h3>
              </div>
              <span>{pendingRate}%</span>
            </div>

            <div className="invoice-report-item total">
              <div>
                <p>Total Tickets</p>
                <h3>{report?.total}</h3>
              </div>
              <span>100%</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MaintenanceReports;
