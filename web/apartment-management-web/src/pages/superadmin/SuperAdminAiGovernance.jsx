import { useState, useEffect } from "react";
import { getAiSafetyLogs } from "../../services/api";
import "./SuperAdminDashboard.css";

export default function SuperAdminAiGovernance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAiSafetyLogs(1);
        setLogs(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="super-admin-page" id="super-ai-governance-page">
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", borderRadius: "16px", padding: "28px", border: "1px solid #4338ca", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px" }}>
            🛡️ Platform-Wide Multi-Tenant AI Governance Engine
          </h2>
          <p style={{ color: "#c7d2fe", fontSize: "13px", margin: 0, maxWidth: "620px" }}>
            Super Admin real-time oversight of the autonomous <strong>Validation & Safety Agent</strong>. Verifies strict tenant data boundary isolation and intercepts cross-tenant access attempts.
          </p>
        </div>
        <span className="super-badge super-badge--active" style={{ fontSize: "13px", padding: "8px 16px" }}>
          ● Engine Online (Port 5073)
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
          Cross-Tenant Security & Isolation Audit Stream
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
          Global execution traces of agent operations across all apartment complexes.
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading"><div className="spinner" /></div>
      ) : (
        <div className="super-card">
          <div className="super-table-wrap">
            <table className="super-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Workflow Reference</th>
                  <th>Origin Tenant</th>
                  <th>Action Requested</th>
                  <th>Target Entity</th>
                  <th>Tenant Boundary Validation</th>
                  <th>Security Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td><span className="complex-code-badge">{log.id}</span></td>
                    <td style={{ color: "#a5b4fc", fontFamily: "monospace" }}>{log.workflowId}</td>
                    <td>Tenant #{log.tenantId}</td>
                    <td style={{ fontWeight: 600, color: "#fff" }}>{log.actionRequested}</td>
                    <td style={{ color: "#94a3b8" }}>{log.targetEntity}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: log.isolationCheck.includes("BLOCKED") ? "#f87171" : "#34d399",
                        }}
                      >
                        {log.isolationCheck}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`super-badge ${
                          log.status === "Allowed"
                            ? "super-badge--active"
                            : log.status.includes("Blocked")
                            ? "super-badge--gold"
                            : "super-badge--indigo"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
