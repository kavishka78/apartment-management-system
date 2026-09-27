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
  const [simulating, setSimulating] = useState(false);
  const [simPrompt, setSimPrompt] = useState(
    "I want to host my birthday party at the Clubhouse this Saturday from 4 PM to 8 PM for 20 guests and need 4 visitor parking slots."
  );

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

  async function handleSimulateRequest(e) {
    e.preventDefault();
    if (!simPrompt.trim()) return;
    setSimulating(true);

    try {
      const res = await fetch("http://localhost:5073/api/workflows/plan-facility-parking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: simPrompt,
          residentId: 1,
          residentName: "Kamal Perera (A-101)",
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to trigger AI workflow.");
      }

      setSimPrompt("I want to host my birthday party at the Clubhouse this Saturday from 4 PM to 8 PM for 20 guests and need 4 visitor parking slots.");
      await load();
    } catch (err) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div id="ai-approvals-page">
      <Header
        title="Agentic AI Approvals"
        subtitle="Review and action high-impact multi-agent workflow requests."
      >
        <button className="admin-btn admin-btn--secondary" onClick={load} id="btn-refresh-workflows">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 014.51 15" />
          </svg>
          Refresh
        </button>
      </Header>

      {/* Simulator Section */}
      <div className="admin-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
          🚀 Test Resident Request (Mobile Simulation)
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
          Submit a natural language objective for facility booking & visitor parking allocation. The 4-agent pipeline will execute planning, entity extraction, backend tool checks, and business rule validation.
        </p>
        <form onSubmit={handleSimulateRequest} style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="text"
            className="admin-form-input"
            style={{ flex: 1 }}
            value={simPrompt}
            onChange={(e) => setSimPrompt(e.target.value)}
            placeholder="e.g. Reserve Clubhouse for 20 guests and 4 parking slots this Saturday..."
          />
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={simulating}
          >
            {simulating ? "Agents Processing..." : "Submit AI Workflow Request"}
          </button>
        </form>
      </div>

      {error && (
        <div className="overview-error-banner">
          ⚠️ {error}
        </div>
      )}

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
              Use the simulator above to submit an AI request. Pending requests will appear here for manager review and single-click approval.
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
                  <th>Resident</th>
                  <th>Objective & Agent Plan</th>
                  <th>Proposal Summary</th>
                  <th>Validation Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf) => {
                  const proposal = parseJson(wf.proposalJson);
                  const plan = parseJson(wf.planJson);
                  const extracted = parseJson(wf.extractedDataJson);

                  return (
                    <tr key={wf.id}>
                      <td>
                        <span className="wf-id">#{wf.id}</span>
                        <div style={{ fontSize: "0.75rem", color: "#888" }}>{formatDate(wf.createdAt)}</div>
                      </td>
                      <td>
                        <strong>{wf.residentName || "Resident"}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#666" }}>Resident ID: #{wf.residentId}</div>
                      </td>
                      <td className="td-desc" style={{ maxWidth: "320px" }}>
                        <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>"{wf.objective}"</div>
                        {Array.isArray(plan) && plan.length > 0 && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                            <strong>Agent Plan:</strong>
                            <ol style={{ paddingLeft: "1.2rem", margin: "0.2rem 0" }}>
                              {plan.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </td>
                      <td>
                        {proposal && proposal.facilityName ? (
                          <div style={{ fontSize: "0.85rem" }}>
                            <div>🏢 <strong>Facility:</strong> {proposal.facilityName}</div>
                            <div>📅 <strong>Date:</strong> {proposal.date} ({proposal.startTime} - {proposal.endTime})</div>
                            <div>👥 <strong>Guests:</strong> {proposal.guests}</div>
                            <div>🚗 <strong>Visitor Vehicles:</strong> {proposal.visitorVehicles} slots</div>
                          </div>
                        ) : (
                          <span style={{ color: "#999" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${wf.requiresApproval ? "badge--warning" : "badge--success"}`}>
                          {wf.validationStatus || wf.status}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function parseJson(str) {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
