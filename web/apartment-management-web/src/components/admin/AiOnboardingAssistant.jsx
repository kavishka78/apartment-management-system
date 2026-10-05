import { useState } from "react";
import { draftResidentOnboarding, onboardResident } from "../../services/api";

const FIELD_LABELS = [
  ["fullName", "Full name"],
  ["email", "Email"],
  ["phoneNumber", "Phone"],
  ["nationalId", "NIC"],
  ["unitNumber", "Unit"],
  ["plateNumber", "Vehicle plate"],
  ["monthlyIncome", "Monthly income"],
  ["emergencyContact", "Emergency contact"],
  ["moveInDate", "Move-in date"],
];

const EXAMPLE = `Name: Kamal Perera
Email: kamal.p@example.com
Phone: +94 77 123 4567
NIC: 199012345678
Unit: A-101
Plate: CAB-1234
Monthly income: 350000
Emergency contact: Nimali Perera - +94 71 000 1111
Move in: 2026-10-01`;

export default function AiOnboardingAssistant({ tenantId, onCreated }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const analyse = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await draftResidentOnboarding(tenantId, text));
    } catch (err) {
      setError(err.message || "The onboarding assistant failed.");
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    const d = result.draft;
    setBusy(true);
    setError("");
    try {
      await onboardResident({
        tenantId,
        fullName: d.fullName,
        email: d.email,
        phoneNumber: d.phoneNumber,
        nationalId: d.nationalId,
        unitId: null,
        unitNumber: d.unitNumber || "Unassigned",
        monthlyIncome: d.monthlyIncome ?? 0,
        emergencyContact: d.emergencyContact,
        moveInDate: d.moveInDate,
        plateNumber: d.plateNumber,
        vehicleType: "Car",
        makeModel: "",
        parkingSlot: "",
        householdMembers: d.householdMembers || [],
      });
      onCreated?.(d.fullName);
      setResult(null);
      setText("");
    } catch (err) {
      setError(err.message || "Could not create the resident.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-card" style={{ padding: "16px", marginBottom: "16px" }}>
      <h3 style={{ marginTop: 0 }}>AI onboarding assistant</h3>
      <p style={{ fontSize: "13px", color: "#475569", marginTop: 0 }}>
        Paste the resident's details as "Label: value" lines. The assistant drafts the record and flags problems. It never saves anything until you press Create.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={EXAMPLE}
        style={{ width: "100%", padding: "10px", fontFamily: "monospace", fontSize: "13px" }}
      />
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button className="admin-btn" onClick={analyse} disabled={busy || !text.trim()}>
          {busy && !result ? "Analysing…" : "Analyse"}
        </button>
        <button className="admin-btn admin-btn--secondary" type="button" onClick={() => setText(EXAMPLE)} disabled={busy}>
          Use example
        </button>
      </div>

      {error && <div style={{ color: "#b91c1c", marginTop: "10px", fontSize: "13px" }}>{error}</div>}

      {result && (
        <div style={{ marginTop: "14px" }}>
          <div style={{ fontSize: "13px", marginBottom: "8px" }}>
            Extracted by <strong>{result.extractedBy === "gemini" ? "Gemini (LLM)" : "rules (no LLM key set)"}</strong>
            {" · "}
            <span style={{ color: result.ready ? "#059669" : "#dc2626", fontWeight: 600 }}>
              {result.ready ? "Ready to create" : "Fix the errors first"}
            </span>
          </div>

          <table className="admin-table" style={{ marginBottom: "10px" }}>
            <tbody>
              {FIELD_LABELS.map(([key, label]) => (
                <tr key={key}>
                  <th style={{ width: "180px", fontSize: "12px" }}>{label}</th>
                  <td style={{ fontSize: "13px" }}>{result.draft[key] === null || result.draft[key] === "" ? <span style={{ color: "#94a3b8" }}>—</span> : String(result.draft[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.issues.length > 0 && (
            <ul style={{ fontSize: "13px", paddingLeft: "18px" }}>
              {result.issues.map((i, idx) => (
                <li key={idx} style={{ color: i.severity === "error" ? "#b91c1c" : "#b45309" }}>
                  <strong>{i.severity === "error" ? "Error" : "Check"}:</strong> {i.message}
                </li>
              ))}
            </ul>
          )}

          <button className="admin-btn" onClick={create} disabled={!result.ready || busy}>
            {busy ? "Creating…" : "Create resident"}
          </button>
        </div>
      )}
    </div>
  );
}
