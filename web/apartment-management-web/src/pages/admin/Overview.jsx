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
  visitors: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  parking: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h4a4 4 0 010 8H8V7zm0 0V5m0 2v10m0-10H6m2 10H6m2 0v2" />
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
      label: "Visitors Checked-In",
      value: stats?.currentVisitors ?? "—",
      icon: KPI_ICONS.visitors,
      color: "#10b981",
      bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    },
    {
      label: "Visitors with Parking",
      value: stats?.visitorsWithParking ?? "—",
      icon: KPI_ICONS.parking,
      color: "#f59e0b",
      bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    },
    {
      label: "Pending AI Workflows",
      value: Array.isArray(workflows) ? workflows.length : "—",
      icon: KPI_ICONS.ai,
      color: "#8b5cf6",
      bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    },
  ];

  // Build chart data from facilities
  const chartData = (stats?.facilities || []).map((f) => ({
    name: f.name,
    capacity: f.capacity,
  }));

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
        subtitle="Real-time snapshot of facilities, visitors and AI workflows."
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

      {/* Facility Usage Chart */}
      <section className="admin-card overview-chart-card" id="facility-chart">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Facility Capacity Overview</h3>
            <p className="chart-subtitle">
              Maximum capacity per active facility
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
            <BarChart data={chartData} barSize={40} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}
