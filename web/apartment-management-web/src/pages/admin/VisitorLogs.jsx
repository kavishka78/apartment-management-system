import { useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import { getActiveVisitors, checkOutVisitor } from "../../services/api";
import "./VisitorLogs.css";

export default function VisitorLogs() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getActiveVisitors();
      setVisitors(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCheckOut(id) {
    if (!confirm("Check out this visitor?")) return;
    try {
      await checkOutVisitor(id);
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  function statusBadgeClass(status) {
    switch (status) {
      case "CheckedIn":
        return "badge badge--success";
      case "Pending":
        return "badge badge--warning";
      case "CheckedOut":
        return "badge badge--neutral";
      default:
        return "badge badge--info";
    }
  }

  return (
    <div id="visitors-page">
      <Header
        title="Visitor & Parking Logs"
        subtitle="Active visitor passes, access codes and parking assignments."
      >
        <button
          className="admin-btn admin-btn--secondary"
          onClick={load}
          id="btn-refresh-visitors"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 014.51 15" />
          </svg>
          Refresh
        </button>
      </Header>

      {error && (
        <div className="overview-error-banner">⚠️ {error}</div>
      )}

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table" id="visitors-table">
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Access Code</th>
                  <th>Expected Arrival</th>
                  <th>Check-In Time</th>
                  <th>Parking Slot</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                      No active visitors at the moment.
                    </td>
                  </tr>
                ) : (
                  visitors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div className="visitor-name-cell">
                          <div className="visitor-avatar">
                            {v.visitorName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span className="visitor-name">{v.visitorName}</span>
                        </div>
                      </td>
                      <td>
                        <code className="access-code">{v.accessCode}</code>
                      </td>
                      <td>{formatDateTime(v.expectedArrival)}</td>
                      <td>{v.checkInTime ? formatDateTime(v.checkInTime) : "—"}</td>
                      <td>
                        {v.assignedParkingSlot ? (
                          <span className="parking-slot">{v.assignedParkingSlot}</span>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>None</span>
                        )}
                      </td>
                      <td>{v.vehicleNumber || "—"}</td>
                      <td>
                        <span className={statusBadgeClass(v.status)}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        {v.status === "CheckedIn" && (
                          <button
                            className="admin-btn admin-btn--warning admin-btn--sm"
                            onClick={() => handleCheckOut(v.id)}
                          >
                            Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(str) {
  if (!str) return "—";
  const d = new Date(str);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
