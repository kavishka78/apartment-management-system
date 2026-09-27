import { useCallback, useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import {
  getPendingWorkflows,
  approveWorkflow,
  rejectWorkflow,
  reviseWorkflow,
} from "../../services/api";
import "./AiApprovals.css";

export default function AiApprovals() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(() => {
    return getPendingWorkflows()
      .then((data) => {
        setWorkflows(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err.message);
        setWorkflows([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function load() {
    setLoading(true);
    setError(null);
    return fetchData();
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAction(id, action) {
    setActionLoading(id);
    try {
      if (action === "approve") await approveWorkflow(id);
      else if (action === "reject") await rejectWorkflow(id);
      else if (action === "revise") await reviseWorkflow(id, { notes: "Please revise." });
      await load();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div id="ai-approvals-page">
      <Header
        title="Agentic AI Approvals"
        subtitle="Review and action pending AI-generated workflow requests."
      >
        <button className="admin-btn admin-btn--secondary" onClick={load} id="btn-refresh-workflows">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 014.51 15" />
          </svg>
          Refresh
        </button>
      </Header>

      {error && (
        <div className="overview-error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Info banner when endpoint isn't built yet */}
      {!loading && !error && workflows.length === 0 && (
        <div className="ai-info-banner">
          <div className="ai-info-icon">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="ai-info-title">No Pending Workflows</h3>
            <p className="ai-info-text">
              AI workflow requests will appear here once the <code>/api/workflows</code> endpoint is active.
              This page is pre-wired to <strong>GET /api/workflows?status=pending</strong> and will
              automatically display data when the backend module is ready.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : workflows.length > 0 ? (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table" id="workflows-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf) => (
                  <tr key={wf.id}>
                    <td>
                      <span className="wf-id">#{wf.id}</span>
                    </td>
                    <td>
                      <span className="wf-type">{wf.type || wf.workflowType || "—"}</span>
                    </td>
                    <td className="td-desc">
                      {wf.description || wf.details || "—"}
                    </td>
                    <td>{formatDate(wf.createdAt || wf.submittedAt)}</td>
                    <td>
                      <span className="badge badge--warning">
                        {wf.status || "Pending"}
                      </span>
                    </td>
                    <td>
                      <div className="wf-actions">
                        <button
                          className="admin-btn admin-btn--success admin-btn--sm"
                          disabled={actionLoading === wf.id}
                          onClick={() => handleAction(wf.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          disabled={actionLoading === wf.id}
                          onClick={() => handleAction(wf.id, "reject")}
                        >
                          Reject
                        </button>
                        <button
                          className="admin-btn admin-btn--warning admin-btn--sm"
                          disabled={actionLoading === wf.id}
                          onClick={() => handleAction(wf.id, "revise")}
                        >
                          Revise
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
