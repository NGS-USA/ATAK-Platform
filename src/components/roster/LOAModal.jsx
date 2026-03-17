import { useState } from "react";
import { X } from "lucide-react";
import { db } from "@/api/apiClient";

export default function LOAModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    loa_start_date: "",
    loa_end_date: "",
    loa_reason: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.loa_start_date || !form.loa_end_date) return;
    setSaving(true);
    await db.update('Member', member.id, {
      status: "LOA",
      loa_start_date: form.loa_start_date,
      loa_end_date: form.loa_end_date,
      loa_reason: form.loa_reason,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", width: "100%", maxWidth: "480px" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Request Leave of Absence</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{member.unit_name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Start Date *</label>
            <input type="date" value={form.loa_start_date} onChange={e => setForm({ ...form, loa_start_date: e.target.value })}
              style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>End Date *</label>
            <input type="date" value={form.loa_end_date} onChange={e => setForm({ ...form, loa_end_date: e.target.value })}
              style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Reason</label>
            <textarea value={form.loa_reason} onChange={e => setForm({ ...form, loa_reason: e.target.value })} rows={3}
              placeholder="Reason for leave..."
              style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem", resize: "vertical" }} />
          </div>
        </div>
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 18px", cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
          <button onClick={submit} disabled={saving || !form.loa_start_date || !form.loa_end_date}
            style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", opacity: (!form.loa_start_date || !form.loa_end_date) ? 0.5 : 1 }}>
            {saving ? "Saving..." : "Submit LOA"}
          </button>
        </div>
      </div>
    </div>
  );
}
