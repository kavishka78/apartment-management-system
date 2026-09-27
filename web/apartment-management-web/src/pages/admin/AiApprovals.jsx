import { useCallback, useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import { getPendingWorkflows } from "../../services/api";
import "./AiApprovals.css";

export default function AiApprovals() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            console.error("Error fetching workflow logs:", e);
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

  return (
    <div className="ai-approvals-container" id="ai-approvals-page">
      <Header
        title="Resident Agentic AI Audit Log"
        subtitle="Real-time monitoring and auditable trace of resident natural language requests, multi-agent plans, and automated bookings."
      >
        <button className="admin-btn admin-btn--secondary" onClick={load} id="btn-refresh-workflows">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 014.51 15" />
          </svg>
          Refresh Audit Log
        </button>
      </Header>

      {error && (
        <div className="overview-error-banner" style={{ marginBottom: "1.5rem" }}>
          {error}
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
            <h3 className="ai-info-title">No AI Activity Recorded Yet</h3>
            <p className="ai-info-text">
              When residents submit requests through the mobile app using the Agentic AI Assistant, the multi-agent planning logs and database bookings will be recorded here for administrative auditing.
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
                <th style={{ width: "90px" }}>ID & Date</th>
                <th style={{ width: "130px" }}>Resident</th>
                <th style={{ width: "35%" }}>Resident Objective & 4-Agent Plan</th>
                <th style={{ width: "26%" }}>Staged Proposal Details</th>
                <th style={{ width: "16%" }}>Rule Validation</th>
                <th style={{ width: "130px" }}>Booking Status</th>
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
                      <div className="wf-resident-id">Resident ID: #{wf.residentId}</div>
                    </td>

                    {/* Objective & Agent Plan */}
                    <td>
                      <div className="wf-plan-box">
                        <div className="wf-objective-text">"{wf.objective}"</div>
                        {Array.isArray(plan) && plan.length > 0 && (
                          <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "0.2rem" }}>
                              Multi-Agent Execution Log:
                            </div>
                            <ol className="wf-steps-list">
                              {plan.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Proposal Details */}
                    <td>
                      {proposal && proposal.facilityName && !isFailed ? (
                        <div className="wf-proposal-card">
                          <div className="wf-proposal-item">

                            <span><strong>Facility:</strong> {proposal.facilityName}</span>
                          </div>
                          <div className="wf-proposal-item">

                            <span><strong>Date & Time:</strong> {proposal.date} ({proposal.startTime} - {proposal.endTime})</span>
                          </div>
                          <div className="wf-proposal-item">

                            <span><strong>Guests:</strong> {proposal.guests}</span>
                          </div>
                          <div className="wf-proposal-item">

                            <span><strong>Parking Slots:</strong> {proposal.visitorVehicles} ({proposal.assignedParkingSlots?.join(", ") || "Auto-Allocated"})</span>
                          </div>
                          {proposal.isHighImpact && (
                            <div style={{ marginTop: "0.4rem", fontSize: "0.725rem", color: "#b45309", fontWeight: "700" }}>
                              High Impact Event (&gt;10 guests or &gt;2 vehicles)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="wf-proposal-empty">
                          <div style={{ fontWeight: "700", marginBottom: "0.2rem" }}>No Booking Staged</div>
                          <div>Agent 4 halted execution due to rule validation failure.</div>
                        </div>
                      )}
                    </td>

                    {/* Validation */}
                    <td>
                      <div className={`val-badge ${badgeInfo.badgeClass}`}>
                        <span>{badgeInfo.icon}</span>
                        <span>{badgeInfo.label}</span>
                      </div>
                    </td>

                    {/* Status Pill (Read Only Audit View) */}
                    <td>
                      <div>
                        {wf.status === "AutoApproved" ? (
                          <span className="status-pill status-pill--approved">Auto-Booked</span>
                        ) : wf.status === "Approved" ? (
                          <span className="status-pill status-pill--approved">Resident Confirmed</span>
                        ) : wf.status === "Rejected" ? (
                          <span className="status-pill status-pill--rejected">Declined</span>
                        ) : isFailed ? (
                          <span className="status-pill status-pill--rejected">Halted (Failed)</span>
                        ) : (
                          <span className="status-pill status-pill--revision">Awaiting Resident</span>
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
    </div>
  );
}

function getValidationBadgeInfo(validationStatus, status) {
  if (status === "AutoApproved") {
    return { badgeClass: "val-badge--success", label: "Auto-Approved & Booked" };
  }
  if (status === "Approved") {
    return { badgeClass: "val-badge--success", label: "Resident Confirmed & Staged" };
  }
  if (status === "Rejected") {
    return { badgeClass: "val-badge--danger", label: "Declined" };
  }

  const text = (validationStatus || "").toLowerCase();
  if (text.startsWith("failed") || text.startsWith("rejected") || text.includes("insufficient") || text.includes("not found") || text.includes("exceeded")) {
    return { badgeClass: "val-badge--danger", label: validationStatus };
  }
  if (text.includes("valid")) {
    return { badgeClass: "val-badge--success", label: validationStatus };
  }
  return { badgeClass: "val-badge--info", label: validationStatus };
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
