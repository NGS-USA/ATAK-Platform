import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { Flag, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { logAction } from "../components/auditLog";
import { format } from "date-fns";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useUser } from "@clerk/clerk-react";
import ImageUpload from "../components/ImageUpload";

const statusColors = { Active: "#4ade80", Completed: "#94a3b8", Paused: "#f59e0b" };

export default function Campaigns() {
  const { user } = useUser();
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [aars, setAars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ name: "", description: "", status: "Active", start_date: "", map: "", faction: "", image_url: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [c, e, a] = await Promise.all([
      db.list('Campaign', '-created_date', 200),
      db.filter('Event', { type: 'Operation' }),
      db.list('AfterActionReport'),
    ]);
    const order = { Active: 0, Paused: 1, Completed: 2 };
    setCampaigns(c.sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99)));
    setEvents(e);
    setAars(a);
    setLoading(false);
  };

  const getStats = (campaignId) => {
    const linked = events.filter(e => e.campaign_id === campaignId);
    const completed = linked.filter(e => aars.some(a => a.event_id === e.id));
    return { total: linked.length, completed: completed.length };
  };

  const canEdit = user?.publicMetadata?.role === "admin";

  const save = async () => {
    if (editing) {
      await db.update('Campaign', editing.id, form);
      logAction({ action: "UPDATE_CAMPAIGN", target: form.name, details: `Status: ${form.status} | Map: ${form.map || "N/A"} | Faction: ${form.faction || "N/A"}`, section: "Campaigns" });
    } else {
      await db.create('Campaign', form);
      logAction({ action: "CREATE_CAMPAIGN", target: form.name, details: `Status: ${form.status} | Map: ${form.map || "N/A"} | Faction: ${form.faction || "N/A"} | Start: ${form.start_date || "TBD"}`, section: "Campaigns" });
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const del = async (id) => {
    if (!confirm("Delete this campaign?")) return;
    const c = campaigns.find(c => c.id === id);
    await db.delete('Campaign', id);
    logAction({ action: "DELETE_CAMPAIGN", target: c?.name || id, details: `Status was: ${c?.status} | Map: ${c?.map || "N/A"} | Faction: ${c?.faction || "N/A"}`, section: "Campaigns" });
    load();
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", status: c.status, start_date: c.start_date || "", map: c.map || "", faction: c.faction || "", image_url: c.image_url || "" });
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Flag size={20} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Campaigns</h1>
        </div>
        {canEdit && (
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", description: "", status: "Active", start_date: "", map: "", faction: "", image_url: "" }); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
            <Plus size={16} /> New Campaign
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", fontWeight: 700 }}>{editing ? "Edit Campaign" : "New Campaign"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Name", key: "name", type: "text" },
              { label: "Map/AO", key: "map", type: "text" },
              { label: "Faction", key: "faction", type: "text" },
              { label: "Start Date", key: "start_date", type: "date" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
                {["Active", "Paused", "Completed"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Campaign Image Upload */}
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Campaign Image</label>
              {form.image_url && (
                <img src={form.image_url} alt="Campaign" style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "8px" }} />
              )}
              <ImageUpload
                label={form.image_url ? "Replace Image" : "Upload Image"}
                folder="atak-platform/campaigns"
                currentUrl={null}
                onUpload={(url) => setForm({ ...form, image_url: url })}
                transformation={[{ width: 800, quality: "auto:good" }, { fetch_format: "auto" }]}
              />
              {form.image_url && (
                <button onClick={() => setForm({ ...form, image_url: "" })}
                  style={{ marginTop: "6px", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}>
                  Remove image
                </button>
              )}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Description</label>
              <ReactQuill value={form.description} onChange={val => setForm({ ...form, description: val })} theme="snow" style={{ borderRadius: "6px", height: "200px" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "13rem" }}>
            <button onClick={save} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontWeight: 600 }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {campaigns.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>No campaigns yet</div>}
          {campaigns.map(c => {
            const { total, completed } = getStats(c.id);
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const open = expanded[c.id];
            return (
              <div key={c.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>

                {/* Campaign Image Banner */}
                {c.image_url && (
                  <div style={{ width: "100%", height: "160px", overflow: "hidden", position: "relative" }}>
                    <img src={c.image_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, var(--bg-card) 100%)" }} />
                  </div>
                )}

                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{c.name}</span>
                      <span style={{ background: `${statusColors[c.status]}20`, color: statusColors[c.status], fontSize: "0.75rem", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>{c.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {canEdit && <>
                        <button onClick={() => openEdit(c)} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "var(--text-secondary)" }}><Edit2 size={13} /></button>
                        <button onClick={() => del(c.id)} style={{ background: "#ef444420", border: "1px solid #ef4444", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#ef4444" }}><Trash2 size={13} /></button>
                      </>}
                      <button onClick={() => setExpanded({ ...expanded, [c.id]: !open })}
                        style={{ background: open ? "var(--accent)20" : "var(--bg-secondary)", border: `1px solid ${open ? "var(--accent)" : "var(--border)"}`, cursor: "pointer", color: open ? "var(--accent)" : "var(--text-secondary)", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s" }}>
                        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        <span>{open ? "Hide" : "Details"}</span>
                      </button>
                    </div>
                  </div>
                  {c.description && (
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "12px", wordBreak: "break-word", overflowWrap: "break-word", maxWidth: "100%", overflow: "hidden" }}
                      dangerouslySetInnerHTML={{ __html: c.description }} />
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Operations: {completed}/{total}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: "3px", transition: "width 0.3s" }} />
                  </div>
                </div>

                {open && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.5rem", background: "var(--bg-secondary)" }}>
                    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                      {c.map && <div><span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>MAP/AO</span><div style={{ fontWeight: 600 }}>{c.map}</div></div>}
                      {c.faction && <div><span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>FACTION</span><div style={{ fontWeight: 600 }}>{c.faction}</div></div>}
                      {c.start_date && <div><span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>STARTED</span><div style={{ fontWeight: 600 }}>{format(new Date(c.start_date), "MMM d, yyyy")}</div></div>}
                    </div>
                    {(() => {
                      const linked = events.filter(e => e.campaign_id === c.id);
                      if (linked.length === 0) return <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>No operations linked to this campaign yet.</div>;
                      return (
                        <div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "6px" }}>LINKED OPERATIONS</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {linked.map(e => {
                              const hasAAR = aars.some(a => a.event_id === e.id);
                              return (
                                <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "var(--bg-card)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                                  <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{e.title}</span>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{format(new Date(e.date), "MMM d, yyyy")}</span>
                                    <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600, background: hasAAR ? "#4ade8020" : "#94a3b820", color: hasAAR ? "#4ade80" : "#94a3b8" }}>
                                      {hasAAR ? "AAR Filed" : "Pending"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}