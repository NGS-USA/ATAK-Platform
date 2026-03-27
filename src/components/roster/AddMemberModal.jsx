import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { db } from "@/api/apiClient";
import { logAction } from "../auditLog";
import { RANKS } from "./ranks";

export default function AddMemberModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ unit_name: "", rank: "", position: "", element: "", discord_username: "", direct_superior_name: "", status: "Active", join_date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [orbatElements, setOrbatElements] = useState([]);

  useEffect(() => {
    db.list('Member').then(setAllMembers);
    db.list('OrbatElement', 'order', 100).then(setOrbatElements);
  }, []);

  const ELEMENTS = orbatElements.map(e => e.name);
  const POSITIONS_BY_ELEMENT = orbatElements.reduce((acc, e) => {
    acc[e.name] = e.positions || [];
    return acc;
  }, {});

  const getAvailablePositions = () => {
    if (!form.element) return [];
    const allPositions = POSITIONS_BY_ELEMENT[form.element] || [];
    const taken = allMembers
      .filter(m => m.element === form.element && m.position)
      .map(m => m.position);
    return allPositions.filter(p => !taken.includes(p));
  };

  const submit = async () => {
    if (!form.unit_name || !form.rank) return;
    setSaving(true);
    await db.create('Member', form);
    logAction({ action: "CREATE_MEMBER", target: form.unit_name, details: `Rank: ${form.rank} | Element: ${form.element || "Unassigned"} | Position: ${form.position || "None"} | Status: ${form.status}`, section: "Roster" });
    setSaving(false);
    onSaved();
  };

  const textFields = [
    { label: "Unit Name *", key: "unit_name" },
    { label: "Discord Username", key: "discord_username" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", width: "100%", maxWidth: "520px" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700 }}>Add Member</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {textFields.map(({ label, key }) => (
              <div key={key}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>{label}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Rank *</label>
              <select value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }}>
                <option value="">Select rank...</option>
                {RANKS.map(r => <option key={r.abbr} value={r.abbr}>{r.abbr} — {r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Direct Superior</label>
              <select value={form.direct_superior_name} onChange={e => setForm({ ...form, direct_superior_name: e.target.value })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }}>
                <option value="">None</option>
                {allMembers.filter(m => m.status === "Active").map(m => <option key={m.id} value={m.unit_name}>{m.unit_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Element</label>
              <select value={form.element} onChange={e => setForm({ ...form, element: e.target.value, position: "" })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }}>
                <option value="">Select element...</option>
                {ELEMENTS.map(el => <option key={el} value={el}>{el}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Position</label>
              <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                disabled={!form.element}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem", opacity: !form.element ? 0.5 : 1 }}>
                <option value="">Select position...</option>
                {getAvailablePositions().map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }}>
                {["Active", "Inactive", "LOA", "Discharged"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Join Date</label>
              <input type="date" value={form.join_date} onChange={e => setForm({ ...form, join_date: e.target.value })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }} />
            </div>
          </div>
        </div>
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 18px", cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
          <button onClick={submit} disabled={saving || !form.unit_name || !form.rank}
            style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", opacity: (!form.unit_name || !form.rank) ? 0.5 : 1 }}>
            {saving ? "Saving..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}
