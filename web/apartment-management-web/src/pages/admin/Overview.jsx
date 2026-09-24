import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Header from "../../components/admin/Header";
import { getDashboardStats, getPendingWorkflows } from "../../services/api";
import "./Overview.css";

const KPI_ICONS = {
  facilities: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  bookings: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  visitors: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ai: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [dashStats, wf] = await Promise.allSettled([
          getDashboardStats(),
          getPendingWorkflows(),
        ]);

        if (dashStats.status === "fulfilled") setStats(dashStats.value);
        if (wf.status === "fulfilled") setWorkflows(wf.value);
        else setWorkflows([]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpiCards = [
    {
      label: "Active Facilities",
      value: stats?.activeFacilities ?? "—",
      icon: KPI_ICONS.facilities,
      color: "#6366f1",
      bg: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    },
    {
      label: "Resident Bookings",
      value: stats?.totalBookings ?? "0",
      icon: KPI_ICONS.bookings,
      color: "#059669",
      bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    },
    {
      label: "Visitors Checked-In",
      value: stats?.currentVisitors ?? "—",
      icon: KPI_ICONS.visitors,
      color: "#3b82f6",
      bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    },
    {
      label: "Pending AI Workflows",
      value: Array.isArray(workflows) ? workflows.length : "—",
      icon: KPI_ICONS.ai,
      color: "#8b5cf6",
      bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    },
  ];

  // Build chart data comparing facility capacity with total resident bookings per facility
  const chartData = (stats?.facilities || []).map((f) => {
    const bookingCount = (stats?.bookings || []).filter(
      (b) => b.facilityId === f.id || b.facilityName?.toLowerCase() === f.name?.toLowerCase()
    ).length;

    return {
      name: f.name,
      capacity: f.capacity,
      bookings: bookingCount,
    };
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div id="overview-page">
      <Header
        title="Overview Dashboard"
        subtitle="Real-time snapshot of facilities, resident bookings, visitors and AI workflows."
      />

      {error && (
        <div className="overview-error-banner">
          <span>⚠️ Some data failed to load: {error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <section className="kpi-grid" id="kpi-section">
        {kpiCards.map((card) => (
          <div className="kpi-card" key={card.label} style={{ background: card.bg }}>
            <div className="kpi-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <div className="kpi-info">
              <p className="kpi-label">{card.label}</p>
              <h2 className="kpi-value" style={{ color: card.color }}>
                {card.value}
              </h2>
            </div>
          </div>
        ))}
      </section>

      {/* Facility Usage & Bookings Chart */}
      <section className="admin-card overview-chart-card" id="facility-chart">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Facility Capacity vs. Resident Bookings</h3>
            <p className="chart-subtitle">
              Comparison of maximum capacity and resident bookings per facility
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="admin-loading" style={{ minHeight: 160 }}>
            <p style={{ color: "#9ca3af" }}>
              No facility data available yet.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={chartData} barSize={32} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="capacity"
                name="Capacity"
                fill="url(#capGradient)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="bookings"
                name="Resident Bookings"
                fill="url(#bookingGradient)"
                radius={[6, 6, 0, 0]}
              />
              <defs>
                <linearGradient id="capGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Resident Bookings Table */}
      <section className="admin-card" style={{ marginTop: "24px" }} id="resident-bookings-section">
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1f2937", margin: 0 }}>
            Recent Resident Facility Bookings
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "4px 0 0 0" }}>
            List of facility reservations requested by residents
          </p>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table" id="bookings-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Facility</th>
                <th>Resident ID</th>
                <th>Booking Date</th>
                <th>Time Slot</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(!stats?.bookings || stats.bookings.length === 0) ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                    No resident bookings recorded yet.
                  </td>
                </tr>
              ) : (
                stats.bookings.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>
                      <span className="facility-name">{b.facilityName || `Facility #${b.facilityId}`}</span>
                    </td>
                    <td>Resident #{b.residentId}</td>
                    <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                    <td>
                      {b.startTime?.substring(0, 5)} - {b.endTime?.substring(0, 5)}
                    </td>
                    <td>
                      <span className={`badge ${
                        b.status === "Approved" ? "badge--success" :
                        b.status === "Pending" ? "badge--warning" : "badge--danger"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
