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

  // Revision Modal State
  const [reviseModal, setReviseModal] = useState({
    open: false,
    workflowId: null,
    notes: "",
  });

  const fetchData = useCallback(() => {
    return getPendingWorkflows()
      .then(async (data) => {
        let list = Array.isArray(data) ? data : [];
        if (list.length === 0) {
          try {
            const allRes = await fetch("http://localhost:5073/api/workflows");
            if (allRes.ok) {
              const allData = await allRes.json();
              if (Array.isArray(allData)) list = allData;
            }
          } catch (e) {
            console.error("Error fetching all workflows fallback:", e);
          }
        }
        setWorkflows(list);
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

  async function handleAction(id, action, customNotes = null) {
    setActionLoading(id);
    try {
      if (action === "approve") {
        await approveWorkflow(id);
      } else if (action === "reject") {
        await rejectWorkflow(id);
      } else if (action === "revise") {
        await reviseWorkflow(id, { notes: customNotes || "Please revise your request." });
      }
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

  function openReviseModal(workflowId) {
    setReviseModal({
      open: true,
      workflowId,
      notes: "Facility availability conflict or guest threshold exceeded. Please pick another time slot.",
    });
  }

  async function submitRevision() {
    if (!reviseModal.workflowId) return;
    const wid = reviseModal.workflowId;
    const notes = reviseModal.notes;
    setReviseModal({ open: false, workflowId: null, notes: "" });
    await handleAction(wid, "revise", notes);
  }

  return (
    <div className="ai-approvals-container" id="ai-approvals-page">
      <Header
        title="Agentic AI Approvals"
        subtitle="Human-in-the-Loop review portal for high-impact multi-agent facility and parking workflows."
      >
        <button className="admin-btn admin-btn--secondary" onClick={load} id="btn-refresh-workflows">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 014.51 15" />
          </svg>
          Refresh
        </button>
      </Header>

      {/* Mobile Resident Request Simulator */}
      <div className="ai-sim-card">
        <div className="ai-sim-title">
          <span>🚀 Resident Mobile Simulator</span>
          <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: "12px", color: "#475569" }}>
            4-Agent LangGraph Pipeline
          </span>
        </div>
        <p className="ai-sim-desc">
          Submit a complex multi-domain objective. The Planner, Analyzer, Tool Action, and Validation agents will generate a structured plan, query real DB records, and pause high-impact requests for human manager approval.
        </p>
        <form onSubmit={handleSimulateRequest} className="ai-sim-form">
          <input
            type="text"
            className="ai-sim-input"
            value={simPrompt}
            onChange={(e) => setSimPrompt(e.target.value)}
            placeholder="e.g. Request Banquet & Party Hall for 20 guests and 4 visitor parking slots..."
          />
          <button type="submit" className="admin-btn admin-btn--primary" disabled={simulating}>
            {simulating ? "Agents Processing..." : "Execute AI Request"}
          </button>
        </form>
      </div>

      {error && (
        <div className="overview-error-banner" style={{ marginBottom: "1.5rem" }}>
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
              Use the mobile request simulator above to test resident objectives. Requests will appear here for human manager approval.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : workflows.length > 0 ? (
        <div className="ai-table-card">
          <table className="ai-table" id="workflows-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>ID & Date</th>
                <th style={{ width: "130px" }}>Resident</th>
                <th style={{ width: "35%" }}>Objective & Agent Execution Plan</th>
                <th style={{ width: "26%" }}>AI Proposal Summary</th>
                <th style={{ width: "16%" }}>Validation Status</th>
                <th style={{ width: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => {
                const proposal = parseJson(wf.proposalJson);
                const plan = parseJson(wf.planJson);
                const valStatusText = wf.validationStatus || wf.status || "Pending";

                const isFailed =
                  valStatusText.startsWith("Failed") ||
                  valStatusText.startsWith("Rejected") ||
                  valStatusText.toLowerCase().includes("insufficient") ||
                  valStatusText.toLowerCase().includes("not found");

                const isApproved = wf.status === "Approved";
                const isRejected = wf.status === "Rejected";
                const isRevision = wf.status === "RequiresRevision";

                const badgeInfo = getValidationBadgeInfo(valStatusText, wf.status);

                return (
                  <tr key={wf.id}>
                    {/* ID & Timestamp */}
                    <td>
                      <div className="wf-meta-id">#{wf.id}</div>
                      <div className="wf-meta-date">{formatDate(wf.createdAt)}</div>
                    </td>

                    {/* Resident Info */}
                    <td>
                      <div className="wf-resident-name">{wf.residentName || "Resident"}</div>
                      <div className="wf-resident-id">ID: #{wf.residentId}</div>
                    </td>

                    {/* Objective & Full Agent Execution Plan */}
                    <td>
                      <div className="wf-plan-box">
                        <div className="wf-objective-text">"{wf.objective}"</div>
                        {Array.isArray(plan) && plan.length > 0 && (
                          <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "0.2rem" }}>
                              🧠 Agent Execution Plan (4-Node Pipeline):
                            </div>
                            <ol className="wf-steps-list">
                              {plan.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {wf.managerNotes && (
                          <div style={{ fontSize: "0.775rem", background: "#fef3c7", borderLeft: "3px solid #f59e0b", padding: "0.4rem 0.6rem", borderRadius: "0 4px 4px 0", color: "#92400e" }}>
                            <strong>Manager Note:</strong> {wf.managerNotes}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Proposal Summary Card */}
                    <td>
                      {proposal && proposal.facilityName && !isFailed ? (
                        <div className="wf-proposal-card">
                          <div className="wf-proposal-item">
                            <span>🏢</span>
                            <span><strong>Facility:</strong> {proposal.facilityName}</span>
                          </div>
                          <div className="wf-proposal-item">
                            <span>📅</span>
                            <span><strong>Date & Time:</strong> {proposal.date} ({proposal.startTime} - {proposal.endTime})</span>
                          </div>
                          <div className="wf-proposal-item">
                            <span>👥</span>
                            <span><strong>Guest Count:</strong> {proposal.guests}</span>
                          </div>
                          <div className="wf-proposal-item">
                            <span>🚗</span>
                            <span><strong>Parking Slots:</strong> {proposal.visitorVehicles} ({proposal.assignedParkingSlots?.join(", ") || "Auto-Allocated"})</span>
                          </div>
                          {proposal.isHighImpact && (
                            <div style={{ marginTop: "0.4rem", fontSize: "0.725rem", color: "#b45309", fontWeight: "700" }}>
                              ⚠️ High Impact Event (&gt;15 guests or &gt;3 vehicles)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="wf-proposal-empty">
                          <div style={{ fontWeight: "700", marginBottom: "0.2rem" }}>❌ No Proposal Generated</div>
                          <div>Agent 4 halted execution due to validation rule failure.</div>
                        </div>
                      )}
                    </td>

                    {/* Validation & Security Status */}
                    <td>
                      <div className={`val-badge ${badgeInfo.badgeClass}`}>
                        <span>{badgeInfo.icon}</span>
                        <span>{badgeInfo.label}</span>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td>
                      <div className="wf-actions-col">
                        {isApproved ? (
                          <span className="status-pill status-pill--approved">✓ Approved & Staged</span>
                        ) : isRejected ? (
                          <span className="status-pill status-pill--rejected">✕ Rejected by Manager</span>
                        ) : (
                          <>
                            {isRevision && (
                              <span className="status-pill status-pill--revision" style={{ marginBottom: "0.25rem" }}>
                                ✍️ Revision Requested
                              </span>
                            )}
                            <button
                              className="btn-action btn-action--approve"
                              disabled={actionLoading === wf.id || isFailed}
                              title={isFailed ? "Cannot approve: Rule validation failed" : "Approve request and issue facility/parking passes"}
                              onClick={() => handleAction(wf.id, "approve")}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-action btn-action--reject"
                              disabled={actionLoading === wf.id}
                              title="Reject this request"
                              onClick={() => handleAction(wf.id, "reject")}
                            >
                              Reject
                            </button>
                            <button
                              className="btn-action btn-action--revise"
                              disabled={actionLoading === wf.id}
                              title="Send back to resident with notes"
                              onClick={() => openReviseModal(wf.id)}
                            >
                              Revise
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Revision Manager Note Modal */}
      {reviseModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">✍️ Request Revision from Resident</h3>
            <p className="modal-desc">
              Provide feedback or instructions for the resident (e.g. requesting a different time slot or fewer visitor vehicles).
            </p>
            <textarea
              className="modal-textarea"
              value={reviseModal.notes}
              onChange={(e) => setReviseModal({ ...reviseModal, notes: e.target.value })}
              placeholder="Enter revision notes here..."
            />
            <div className="modal-actions">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => setReviseModal({ open: false, workflowId: null, notes: "" })}
              >
                Cancel
              </button>
              <button className="admin-btn admin-btn--warning" onClick={submitRevision}>
                Submit Revision Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getValidationBadgeInfo(validationStatus, status) {
  if (status === "Approved") {
    return { badgeClass: "val-badge--success", icon: "✅", label: "Approved & Executed in DB" };
  }
  if (status === "Rejected") {
    return { badgeClass: "val-badge--danger", icon: "⛔", label: "Rejected by Manager" };
  }
  if (status === "RequiresRevision") {
    return { badgeClass: "val-badge--warning", icon: "✍️", label: "Revision Note Sent" };
  }

  const text = (validationStatus || "").toLowerCase();
  if (text.startsWith("failed") || text.startsWith("rejected") || text.includes("insufficient") || text.includes("not found") || text.includes("exceeded")) {
    return { badgeClass: "val-badge--danger", icon: "❌", label: validationStatus };
  }
  if (text.includes("valid")) {
    return { badgeClass: "val-badge--success", icon: "🟢", label: validationStatus };
  }
  return { badgeClass: "val-badge--info", icon: "ℹ️", label: validationStatus };
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
    hour: "2-digit",
    minute: "2-digit",
  });
}
