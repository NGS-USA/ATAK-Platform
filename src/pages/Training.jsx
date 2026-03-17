import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { BookOpen, Plus, Check, Search } from "lucide-react";
import { format } from "date-fns";
import { QUALIFICATIONS } from "../components/constants/qualifications";
import { useUser } from "@clerk/clerk-react";

export default function Training() {
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ qualification: "", qualification_category: "Standard", training_date: "", notes: "", passed_names: [], failed_names: [] });
  const [selectedPassed, setSelectedPassed] = useState([]);
  const [selectedFailed, setSelectedFailed] = useState([]);
  const [searchPassed, setSearchPassed] = useState("");
  const [searchFailed, setSearchFailed] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
  try {
    const [m, r] = await Promise.all([
      db.filter('Member', { status: 'Active' }),
      db.list('TrainingRecord', '-training_date', 30),
    ]);
    setRecords(r);
    setMembers(m);
  } catch (err) {
    console.error("Failed to load training data:", err);
  }
  setLoading(false);
};
      setRecords(r);
      setMembers(m);
      setUser(u);
    } catch (err) {
      console.error("Failed to load training data:", err);
    }
    setLoading(false);
  };

  const canSubmit = user?.publicMetadata?.role === "admin";

  const save = async () => {
    await db.create('TrainingRecord', {
  ...form,
  trainer_name: user?.fullName || user?.primaryEmailAddress?.emailAddress,
  trainer_id: user?.id,
  passed_members: selectedPassed.map(n => members.find(m => m.unit_name === n)?.id).filter(Boolean),
  failed_members: selectedFailed.map(n => members.find(m => m.unit_name === n)?.id).filter(Boolean),
  passed_names: selectedPassed,
  failed_names: selectedFailed,
});
    setShowForm(false);
    setSelectedPassed([]);
    setSelectedFailed([]);
    setForm({ qualification: "", qualification_category: "Standard", training_date: "", notes: "", passed_names: [], failed_names: [] });
    load();
  };

  const toggleMember = (name, list, setList) => {
    setList(list.includes(name) ? list.filter(n => n !== name) : [...list, name]);
  };

  const allQuals = Object.values(QUALIFICATIONS).flat();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BookOpen size={20} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Training Records</h1>
        </div>
        {canSubmit && (
          <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
            <Plus size={16} /> Submit Training
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Submit Training Results</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Category</label>
              <select value={form.qualification_category} onChange={e => setForm({ ...form, qualification_category: e.target.value, qualification: "" })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
                {Object.keys(QUALIFICATIONS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Qualification</label>
              <select value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
                <option value="">Select...</option>
                {(QUALIFICATIONS[form.qualification_category] || []).map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Training Date</label>
              <input type="datetime-local" value={form.training_date} onChange={e => setForm({ ...form, training_date: e.target.value })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Notes</label>
              <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Passed", list: selectedPassed, setList: setSelectedPassed, color: "#4ade80", search: searchPassed, setSearch: setSearchPassed },
              { label: "Failed", list: selectedFailed, setList: setSelectedFailed, color: "#ef4444", search: searchFailed, setSearch: setSearchFailed }
            ].map(({ label, list, setList, color, search, setSearch }) => {
              const filtered = members.filter(m => m.unit_name?.toLowerCase().includes(search.toLowerCase()));
              return (
                <div key={label}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>{label} Members ({list.length})</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 10px", marginBottom: "6px" }}>
                    <Search size={13} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: "0.85rem", width: "100%" }} />
                  </div>
                  <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "6px", background: "var(--bg-secondary)" }}>
                    {filtered.map(m => (
                      <div key={m.id} onClick={() => toggleMember(m.unit_name, list, setList)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: list.includes(m.unit_name) ? `${color}15` : "transparent" }}>
                        <div style={{ width: "16px", height: "16px", border: `2px solid ${list.includes(m.unit_name) ? color : "var(--border)"}`, borderRadius: "3px", background: list.includes(m.unit_name) ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {list.includes(m.unit_name) && <Check size={10} color="#000" />}
                        </div>
                        <span style={{ fontSize: "0.85rem" }}>{m.unit_name}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: "auto" }}>{m.rank}</span>
                      </div>
                    ))}
                    {filtered.length === 0 && <div style={{ padding: "10px", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>No members found</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
            <button onClick={save} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontWeight: 600 }}>Submit</button>
            <button onClick={() => setShowForm(false)} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading...</div> : (
        <div>
          {records.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>No training records yet</div>}
          {records.map(r => (
            <div key={r.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{r.qualification}</span>
                  <span style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", marginLeft: "8px" }}>{r.qualification_category}</span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{r.training_date ? format(new Date(r.training_date), "MMM d, yyyy") : "—"}</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Trainer: {r.trainer_name || "Unknown"}</div>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#4ade80", fontWeight: 600 }}>PASSED ({r.passed_names?.length || 0})</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                    {(r.passed_names || []).map(n => <span key={n} style={{ background: "#4ade8015", border: "1px solid #4ade8040", color: "#4ade80", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px" }}>{n}</span>)}
                  </div>
                </div>
                {(r.failed_names?.length > 0) && (
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 600 }}>FAILED ({r.failed_names.length})</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                      {r.failed_names.map(n => <span key={n} style={{ background: "#ef444415", border: "1px solid #ef444440", color: "#ef4444", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px" }}>{n}</span>)}
                    </div>
                  </div>
                )}
              </div>
              {r.notes && <div style={{ marginTop: "8px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>Notes: {r.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}