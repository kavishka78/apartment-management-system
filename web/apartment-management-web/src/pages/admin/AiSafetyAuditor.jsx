import { useState, useEffect } from "react";
import { getAiSafetyLogs } from "../../services/api";
import "./AiSafetyAuditor.css";

export default function AiSafetyAuditor() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getAiSafetyLogs(1);
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === "All") return true;
    return log.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Allowed":
        return <span className="badge badge--success">✓ Policy Passed</span>;
      case "PausedForHumanApproval":
        return <span className="badge badge--warning">⚠️ High-Impact Pause</span>;
      case "BlockedSecurityViolation":
        return <span className="badge badge--danger">🚫 Blocked / Rejected</span>;
      default:
        return <span className="badge badge--neutral">{status}</span>;
    }
  };

  return (
    <div className="safety-auditor-page" id="safety-auditor-page">
      {/* Agent Banner */}
      <div className="agent-identity-card">
        <div>
          <h2>Validation & Safety Agent (AI Subsystem)</h2>
          <p>
            Autonomous security enforcement layer. Continuously validates multi-tenant data isolation, verifies RBAC roles,
            enforces deterministic schema conformance, and halts high-impact actions for Human-in-the-Loop review.
          </p>
        </div>
        <div className="agent-badge-pill">
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
          Safety Agent Active (Port 5073)
        </div>
      </div>

      {/* Header & Filter */}
      <div className="page-header" style={{ marginTop: "8px" }}>
        <div>
          <h1>Real-Time Security & Policy Audit Trail</h1>
          <p>Durable execution traces of allow-listed tool calls, tenant boundaries, and policy validation checks.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          >
            <option value="All">All Audit Logs</option>
            <option value="Allowed">Allowed Actions</option>
            <option value="PausedForHumanApproval">Paused for Approval (&gt; LKR 25,000)</option>
            <option value="BlockedSecurityViolation">Security Violations</option>
          </select>
          <button className="admin-btn admin-btn--secondary" onClick={loadLogs}>
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Workflow Ref</th>
                <th>Requested Action</th>
                <th>Target Scope</th>
                <th>Tenant Isolation Check</th>
                <th>RBAC Check</th>
                <th>Policy / Spending Rule</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="log-id-badge">{log.id}</span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#4f46e5" }}>
                    {log.workflowId}
                  </td>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{log.actionRequested}</td>
                  <td>
                    <span style={{ fontSize: "12px", color: "#475569" }}>{log.targetEntity}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: log.isolationCheck.includes("BLOCKED") ? "#dc2626" : "#059669", fontWeight: 600 }}>
                      {log.isolationCheck}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px" }}>{log.rbacCheck}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: log.spendingCheck.includes("TRIGGERED") ? "#d97706" : "#64748b", fontWeight: log.spendingCheck.includes("TRIGGERED") ? 600 : 400 }}>
                      {log.spendingCheck}
                    </span>
                  </td>
                  <td>{getStatusBadge(log.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
