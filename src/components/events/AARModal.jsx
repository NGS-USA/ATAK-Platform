import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { X, Search, CheckSquare, Square } from "lucide-react";

export default function AARModal({ event, currentUser, onClose, onSubmitted }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState({ outcome: "Success", casualties: "", assets_lost: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    db.filter('Member', { status: "Active" }).then(setMembers);
  }, []);

  const filtered = members.filter(m =>
    m.unit_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.rank?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMember = (m) => {
    setSelectedIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]);
  };

  const submit = async () => {
    setSubmitting(true);
    const selectedMembers = members.filter(m => selectedIds.includes(m.id));

    await db.create('AfterActionReport', {
      event_id: event.id,
      event_name: event.title,
      outcome: form.outcome,
      casualties: form.casualties,
      assets_lost: form.assets_lost,
      notes: form.notes,
      submitted_by_id: currentUser.id,
      submitted_by_name: currentUser.fullName || currentUser.primaryEmailAddress?.emailAddress,
      attended_member_ids: selectedIds,
      attended_member_names: selectedMembers.map(m => m.unit_name),
    });

    await Promise.all(selectedMembers.map(m =>
      db.create('Attendance', {
        event_id: event.id,
        event_title: event.title,
        event_type: event.type,
        event_date: event.date,
        member_id: m.id,
        member_name: m.unit_name,
        attended: true,
      })
    ));

    setSubmitting(false);
    onSubmitted();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>After Action Report</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{event.title}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={18} /></button>
        </div>

        <div style={{ overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Outcome</label>
            <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
              {["Success", "Partial Success", "Failure"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Casualties</label>
              <input value={form.casualties} onChange={e => setForm({ ...form, casualties: e.target.value })} placeholder="e.g. 2 KIA" style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Assets Lost</label>
              <input value={form.assets_lost} onChange={e => setForm({ ...form, assets_lost: e.target.value })} placeholder="e.g. 1 vehicle" style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Notes *</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} placeholder="Operational notes, observations, lessons learned..." style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem", resize: "vertical" }} />
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Attendance — <strong style={{ color: "var(--accent)" }}>{selectedIds.length} selected</strong></div>
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px 8px 30px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "6px" }}>
              {filtered.map(m => {
                const selected = selectedIds.includes(m.id);
                return (
                  <div key={m.id} onClick={() => toggleMember(m)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", cursor: "pointer", background: selected ? "rgba(74,222,128,0.08)" : "transparent", borderBottom: "1px solid var(--border)" }}>
                    {selected ? <CheckSquare size={14} style={{ color: "var(--accent)", flexShrink: 0 }} /> : <Square size={14} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />}
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{m.unit_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{m.rank}{m.element ? ` · ${m.element}` : ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
          <button onClick={submit} disabled={submitting || !form.notes}
            style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: submitting || !form.notes ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.875rem", opacity: submitting || !form.notes ? 0.6 : 1 }}>
            {submitting ? "Submitting..." : "Submit AAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
