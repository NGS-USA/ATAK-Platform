import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { db } from "@/api/apiClient";
import { logAction } from "../auditLog";
import { RANKS } from "./ranks";
import { ELEMENTS, POSITIONS_BY_ELEMENT } from "../constants/elements";
import ImageUpload from "../ImageUpload";

export default function EditMemberModal({ member, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({ ...member });
  const [allMembers, setAllMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.list('Member').then(setAllMembers);
  }, []);

  const getAvailablePositions = () => {
    if (!form.element) return [];
    return (POSITIONS_BY_ELEMENT[form.element] || []).filter(p => {
      const takenBy = allMembers.find(m => m.element === form.element && m.position === p && m.id !== form.id);
      return !takenBy;
    });
  };

  const save = async () => {
    setSaving(true);
    await db.update('Member', form.id, form);
    const changes = [];
    if (form.rank !== member.rank) changes.push(`Rank: ${member.rank} → ${form.rank}`);
    if (form.status !== member.status) changes.push(`Status: ${member.status} → ${form.status}`);
    if (form.element !== member.element) changes.push(`Element: ${member.element || "None"} → ${form.element || "None"}`);
    if (form.position !== member.position) changes.push(`Position: ${member.position || "None"} → ${form.position || "None"}`);
    if (form.direct_superior_name !== member.direct_superior_name) changes.push(`Superior: ${member.direct_superior_name || "None"} → ${form.direct_superior_name || "None"}`);
    if (form.avatar_url !== member.avatar_url) changes.push(`Avatar updated`);
    logAction({ action: "UPDATE_MEMBER", target: form.unit_name, details: changes.length ? changes.join(" | ") : "No tracked changes", section: "Roster" });
    setSaving(false);
    onSaved();
  };

  const del = async () => {
    if (!confirm("Remove this member?")) return;
    await db.delete('Member', form.id);
    logAction({ action: "DELETE_MEMBER", target: form.unit_name, details: `Rank: ${form.rank} | Element: ${form.element || "Unassigned"} | Status: ${form.status}`, section: "Roster" });
    onDeleted();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700 }}>Edit Member — {member.unit_name}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "1.5rem" }}>

          {/* Avatar Upload */}
          <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "10px" }}>Member Avatar</label>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {form.avatar_url
                  ? <img src={form.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#000" }}>{form.unit_name?.[0] || "?"}</span>
                }
              </div>
              <ImageUpload
                label="Upload Avatar"
                folder="atak-platform/avatars"
                currentUrl={null}
                onUpload={(url) => setForm({ ...form, avatar_url: url })}
                transformation={[{ width: 200, height: 200, crop: "fill", gravity: "face" }, { quality: "auto:good" }]}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Unit Name", key: "unit_name" },
              { label: "Discord Username", key: "discord_username" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>{label}</label>
                <input value={form[key] || ""} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Rank</label>
              <select value={form.rank || ""} onChange={e => setForm({ ...form, rank: e.target.value })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }}>
                <option value="">Select rank...</option>
                {RANKS.map(r => <option key={r.abbr} value={r.abbr}>{r.abbr} — {r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Direct Superior</label>
              <select value={form.direct_superior_name || ""} onChange={e => setForm({ ...form, direct_superior_name: e.target.value })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }}>
                <option value="">None</option>
                {allMembers.filter(m => m.id !== form.id && m.status === "Active").map(m => <option key={m.id} value={m.unit_name}>{m.unit_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Element</label>
              <select value={form.element || ""} onChange={e => setForm({ ...form, element: e.target.value, position: "" })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }}>
                <option value="">Select element...</option>
                {ELEMENTS.map(el => <option key={el} value={el}>{el}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Position</label>
              <select value={form.position || ""} onChange={e => setForm({ ...form, position: e.target.value })}
                disabled={!form.element}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem", opacity: !form.element ? 0.5 : 1 }}>
                <option value="">Select position...</option>
                {getAvailablePositions().map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Status</label>
              <select value={form.status || "Active"} onChange={e => setForm({ ...form, status: e.target.value })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }}>
                {["Active", "Inactive", "LOA", "Discharged"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Join Date</label>
              <input type="date" value={form.join_date || ""} onChange={e => setForm({ ...form, join_date: e.target.value })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "0.85rem" }} />
            </div>
          </div>
        </div>

        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", justifyContent: "space-between" }}>
          <button onClick={del} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ef444415", border: "1px solid #ef4444", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", color: "#ef4444", fontSize: "0.875rem" }}>
            <Trash2 size={14} /> Remove
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 18px", cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}