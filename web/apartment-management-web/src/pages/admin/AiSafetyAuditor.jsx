import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAiSafetyLogs, decideSafetyVerdict, validateProposedAction } from "../../services/api";
import "./AiSafetyAuditor.css";

const VERDICT_BADGE = {
  approve: { label: "✓ Approved", cls: "badge--success" },
  needs_human: { label: "⚠️ Needs manager", cls: "badge--warning" },
  block: { label: "🚫 Blocked", cls: "badge--danger" },
};

const ACTION_TYPES = ["approve_repair", "book_amenity", "send_notice", "view_resident_data", "update_vehicle", "checkout_order"];
const ROLES = ["Resident", "ApartmentAdmin", "SuperAdmin", "GateSecurity"];

const EMPTY_FORM = {
  role: "ApartmentAdmin",
  actionType: "approve_repair",
  amountLkr: "",
  freeText: "",
};

function parseChecks(checksJson) {
  try {
    return JSON.parse(checksJson || "[]");
  } catch {
    return [];
  }
}

export default function AiSafetyAuditor() {
  const { activeTenantId, currentUser } = useAuth();
  const tenantId = activeTenantId ?? currentUser?.tenantId ?? null;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterVerdict, setFilterVerdict] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const loadLogs = useCallback(async () => {
    if (tenantId == null) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await getAiSafetyLogs(tenantId, filterVerdict);
      setLogs(data || []);
    } catch (err) {
      setError(err.message || "Could not load safety verdicts.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, filterVerdict]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const decide = async (id, decision) => {
    try {
      setBusyId(id);
      await decideSafetyVerdict(id, decision);
      await loadLogs();
    } catch (err) {
      setError(err.message || "Could not record the decision.");
    } finally {
      setBusyId(null);
    }
  };

  const runTest = async (e) => {
    e.preventDefault();
    if (tenantId == null) return;
    setTesting(true);
    setTestResult(null);
    try {
      const proposal = {
        workflowId: `ui-test-${Date.now()}`,
        tenantId,
        proposedBy: "manual_ui_test",
        requester: { userId: currentUser?.id ?? 0, role: form.role, tenantId, residentId: null },
        action: {
          type: form.actionType,
          targetTenantId: tenantId,
          targetResourceId: "ui-test",
          amountLkr: form.amountLkr === "" ? null : Number(form.amountLkr),
        },
        freeText: form.freeText || null,
      };
      const result = await validateProposedAction(proposal);
      setTestResult(result);
      loadLogs();
    } catch (err) {
      setTestResult({ error: err.message || "Validation failed." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="safety-auditor-page" id="safety-auditor-page">
      <div className="agent-identity-card">
        <div>
          <h2>Validation & Safety Agent</h2>
          <p>
            Checks every AI-proposed action against tenant isolation, role permissions, the LKR 25,000 spend limit and
            prompt-injection rules before it runs. Anything above the limit waits for a manager.
          </p>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: "8px" }}>
        <div>
          <h1>Safety Verdict Audit Trail</h1>
          <p>Every checked proposal, with the result of each check. Newest first.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <select
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          >
            <option value="">All verdicts</option>
            <option value="approve">Approved</option>
            <option value="needs_human">Needs manager</option>
            <option value="block">Blocked</option>
          </select>
          <button className="admin-btn admin-btn--secondary" onClick={loadLogs}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ padding: "12px 16px", color: "#b91c1c", marginBottom: "12px" }}>
          {error}
        </div>
      )}

      <div className="admin-card" style={{ padding: "16px", marginBottom: "16px" }}>
        <h3 style={{ marginTop: 0 }}>Test a proposed action</h3>
        <form onSubmit={runTest} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
          <label style={{ fontSize: "12px" }}>
            Requester role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: "100%", padding: "8px" }}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label style={{ fontSize: "12px" }}>
            Action
            <select value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value })} style={{ width: "100%", padding: "8px" }}>
              {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label style={{ fontSize: "12px" }}>
            Amount (LKR)
            <input type="number" min="0" value={form.amountLkr} onChange={(e) => setForm({ ...form, amountLkr: e.target.value })} style={{ width: "100%", padding: "8px" }} />
          </label>
          <label style={{ fontSize: "12px", gridColumn: "1 / -1" }}>
            Free text (optional)
            <input type="text" value={form.freeText} onChange={(e) => setForm({ ...form, freeText: e.target.value })} placeholder='e.g. "Severe pipe leak in Unit 4B"' style={{ width: "100%", padding: "8px" }} />
          </label>
          <div>
            <button type="submit" className="admin-btn" disabled={testing || tenantId == null}>
              {testing ? "Checking…" : "Run safety check"}
            </button>
          </div>
        </form>

        {testResult && (
          <div style={{ marginTop: "12px", fontSize: "13px" }}>
            {testResult.error ? (
              <span style={{ color: "#b91c1c" }}>{testResult.error}</span>
            ) : (
              <>
                <strong>Verdict: </strong>
                <span className={`badge ${VERDICT_BADGE[testResult.verdict]?.cls || "badge--neutral"}`}>
                  {VERDICT_BADGE[testResult.verdict]?.label || testResult.verdict}
                </span>
                <div style={{ marginTop: "6px", color: "#475569" }}>{testResult.reason}</div>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : tenantId == null ? (
        <div className="admin-card" style={{ padding: "16px" }}>No complex is selected.</div>
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Workflow</th>
                <th>Action</th>
                <th>Requester</th>
                <th>Checks</th>
                <th>Verdict</th>
                <th>Human decision</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#64748b" }}>No verdicts yet. Run a safety check above.</td>
                </tr>
              )}
              {logs.map((log) => {
                const badge = VERDICT_BADGE[log.verdict] || { label: log.verdict, cls: "badge--neutral" };
                const checks = parseChecks(log.checksJson);
                return (
                  <tr key={log.id}>
                    <td><span className="log-id-badge">{log.id}</span></td>
                    <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#4f46e5" }}>{log.workflowId}</td>
                    <td style={{ fontWeight: 600 }}>
                      {log.actionType}
                      <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>by {log.proposedBy}</div>
                    </td>
                    <td style={{ fontSize: "12px" }}>{log.requesterRole} #{log.requesterUserId}</td>
                    <td style={{ fontSize: "12px", minWidth: "260px" }}>
                      {checks.map((c) => (
                        <div key={c.name} style={{ color: c.passed ? "#059669" : "#dc2626" }}>
                          {c.passed ? "✓" : "✗"} {c.name}
                          {!c.passed && c.detail ? <span style={{ color: "#64748b" }}> — {c.detail}</span> : null}
                        </div>
                      ))}
                      <div style={{ color: "#64748b", marginTop: "4px" }}>{log.reason}</div>
                    </td>
                    <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                    <td style={{ fontSize: "12px" }}>
                      {log.verdict !== "needs_human" && "—"}
                      {log.verdict === "needs_human" && log.humanDecision && (
                        <span>{log.humanDecision} by {log.decidedBy}</span>
                      )}
                      {log.verdict === "needs_human" && !log.humanDecision && (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="admin-btn" disabled={busyId === log.id} onClick={() => decide(log.id, "approved")}>Approve</button>
                          <button className="admin-btn admin-btn--secondary" disabled={busyId === log.id} onClick={() => decide(log.id, "rejected")}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
