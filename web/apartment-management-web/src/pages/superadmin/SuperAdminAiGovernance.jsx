import { useState, useEffect } from "react";
import { getAiSafetyLogs } from "../../services/api";
import "./SuperAdminLayout.css";

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
    <div id="super-ai-governance-page">
      {/* Header */}
      <div className="sa-page-header">
        <div>
          <p className="sa-page-tag">Platform Security & Multi-Tenancy</p>
          <h1 className="sa-page-title">AI Multi-Tenant Safety & Governance</h1>
          <p className="sa-page-desc">
            Platform-wide oversight of the Validation & Safety Agent. Enforces strict tenant data boundaries and prevents cross-complex information disclosure.
          </p>
        </div>
        <span className="sa-chip sa-chip--green">
          Safety Engine Active
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading"><div className="spinner" /></div>
      ) : (
        <div className="sa-card">
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Workflow Reference</th>
                  <th>Origin Complex</th>
                  <th>Action Requested</th>
                  <th>Target Scope</th>
                  <th>Data Isolation Verification</th>
                  <th>Safety Decision</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td><span className="sa-code-badge">{log.id}</span></td>
                    <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#4f46e5" }}>{log.workflowId}</td>
                    <td>Tenant #{log.tenantId}</td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{log.actionRequested}</td>
                    <td style={{ color: "#64748b" }}>{log.targetEntity}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "12px",
                          color: log.isolationCheck.includes("BLOCKED") ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {log.isolationCheck}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`sa-chip ${
                          log.status === "Allowed"
                            ? "sa-chip--green"
                            : log.status.includes("Blocked")
                            ? "sa-chip--amber"
                            : "sa-chip--indigo"
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
