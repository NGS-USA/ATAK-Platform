import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Search, ChevronRight, Plus, Edit2, X, Trash2 } from "lucide-react";
import LOAModal from "../components/roster/LOAModal";
import { logAction } from "../components/auditLog";
import AddMemberModal from "../components/roster/AddMemberModal";
import EditMemberModal from "../components/roster/EditMemberModal";
import { formatMemberName, getRankLabel } from "../components/roster/ranks";
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "@/lib/AuthContext";

const statusColors = { Active: "#4ade80", Inactive: "#94a3b8", LOA: "#f59e0b", Discharged: "#ef4444" };
const STATUSES = ["Active", "Inactive", "LOA", "Discharged"];

export default function Roster() {
  const [members, setMembers] = useState([]);
  const [orbatElements, setOrbatElements] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Active");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("roster");
  const { user } = useUser();
  const { isAdmin, hasPermission } = useAuth();
  const [loaMember, setLoaMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [editingMember, setEditingMember] = useState(null);

  // Orbat modals
  const [showAddElement, setShowAddElement] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(null); // element object
  const [showEditElement, setShowEditElement] = useState(null); // element object
  const [newElementName, setNewElementName] = useState("");
  const [newPositionName, setNewPositionName] = useState("");
  const [editElementName, setEditElementName] = useState("");
  const [savingOrbat, setSavingOrbat] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [m, el] = await Promise.all([
      db.list('Member', '-join_date', 500),
      db.list('OrbatElement', 'order', 100),
    ]);
    setMembers(m);
    setOrbatElements(el);
    setLoading(false);
  };

  const canEdit = isAdmin || hasPermission('roster');
  const canEditOrbat = isAdmin || hasPermission('orbat');

  const applyStatusChange = async () => {
    const { member, newStatus } = confirmStatus;
    await db.update('Member', member.id, { status: newStatus });
    logAction({ action: "UPDATE_MEMBER_STATUS", target: member.unit_name, details: `Status changed: ${member.status} → ${newStatus} | Rank: ${member.rank} | Element: ${member.element || "Unassigned"}`, section: "Roster" });
    setConfirmStatus(null);
    load();
  };

  const addElement = async () => {
    if (!newElementName.trim()) return;
    setSavingOrbat(true);
    await db.create('OrbatElement', {
      name: newElementName.trim(),
      order: orbatElements.length + 1,
      positions: [],
    });
    logAction({ action: "CREATE_ORBAT_ELEMENT", target: newElementName.trim(), details: "", section: "Roster" });
    setNewElementName("");
    setShowAddElement(false);
    setSavingOrbat(false);
    load();
  };

  const deleteElement = async (element) => {
    if (!confirm(`Delete element "${element.name}"? This will not delete the members assigned to it.`)) return;
    await db.delete('OrbatElement', element.id);
    logAction({ action: "DELETE_ORBAT_ELEMENT", target: element.name, details: "", section: "Roster" });
    load();
  };

  const saveEditElement = async () => {
    if (!editElementName.trim()) return;
    setSavingOrbat(true);
    await db.update('OrbatElement', showEditElement.id, { name: editElementName.trim() });
    logAction({ action: "RENAME_ORBAT_ELEMENT", target: editElementName.trim(), details: `Was: ${showEditElement.name}`, section: "Roster" });
    setShowEditElement(null);
    setEditElementName("");
    setSavingOrbat(false);
    load();
  };

  const addPosition = async () => {
    if (!newPositionName.trim()) return;
    setSavingOrbat(true);
    const updated = [...(showAddPosition.positions || []), newPositionName.trim()];
    await db.update('OrbatElement', showAddPosition.id, { positions: updated });
    logAction({ action: "ADD_ORBAT_POSITION", target: newPositionName.trim(), details: `Element: ${showAddPosition.name}`, section: "Roster" });
    setNewPositionName("");
    setShowAddPosition(null);
    setSavingOrbat(false);
    load();
  };

  const deletePosition = async (element, position) => {
    if (!confirm(`Remove position "${position}" from "${element.name}"?`)) return;
    const updated = (element.positions || []).filter(p => p !== position);
    await db.update('OrbatElement', element.id, { positions: updated });
    logAction({ action: "DELETE_ORBAT_POSITION", target: position, details: `Element: ${element.name}`, section: "Roster" });
    load();
  };

  const filtered = members.filter(m => {
    const matchSearch = !search || m.unit_name?.toLowerCase().includes(search.toLowerCase()) || m.rank?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === "all" || m.status === filter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Users size={20} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Unit Roster</h1>
          <span style={{ background: "#4ade8020", color: "#4ade80", fontSize: "0.75rem", padding: "2px 10px", borderRadius: "20px", fontWeight: 600 }}>{members.filter(m => m.status === "Active").length} Active</span>
          {members.filter(m => m.status === "LOA").length > 0 && (
            <span style={{ background: "#f59e0b20", color: "#f59e0b", fontSize: "0.75rem", padding: "2px 10px", borderRadius: "20px", fontWeight: 600 }}>{members.filter(m => m.status === "LOA").length} LOA</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {canEdit && (
            <button onClick={() => setShowAddMember(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
              <Plus size={15} /> Add Member
            </button>
          )}
          {["roster", "orbat"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "var(--accent)" : "var(--bg-card)", color: view === v ? "#000" : "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize" }}>
              {v === "orbat" ? "ORBAT" : "Roster"}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px", display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px" }}>
          <Search size={15} style={{ color: "var(--text-secondary)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: "0.875rem", width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {["all", "Active", "LOA", "Inactive", "Discharged"].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ background: filter === s ? "var(--accent)" : "var(--bg-card)", color: filter === s ? "#000" : "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading roster...</div>
      ) : view === "roster" ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Name", "Rank", "Element", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px", fontSize: "0.875rem", fontWeight: 500 }}>{formatMemberName(m)}</td>
                  <td style={{ padding: "10px 16px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{getRankLabel(m.rank)}</td>
                  <td style={{ padding: "10px 16px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{m.element || "—"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    {canEdit ? (
                      <select
                        value={m.status}
                        onChange={e => {
                          const newStatus = e.target.value;
                          if (newStatus === "LOA") {
                            setLoaMember(m);
                          } else {
                            setConfirmStatus({ member: m, newStatus });
                          }
                        }}
                        style={{ background: "var(--bg-secondary)", border: `1px solid ${statusColors[m.status] || "#94a3b8"}40`, borderRadius: "6px", padding: "3px 8px", color: statusColors[m.status] || "#94a3b8", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", fontWeight: 600 }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColors[m.status] || "#94a3b8" }} />
                        {m.status}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Link to={createPageUrl("MemberProfile") + `?id=${m.id}`} style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent)", textDecoration: "none", fontSize: "0.8rem" }}>
                        View <ChevronRight size={14} />
                      </Link>
                      {canEdit && (
                        <button onClick={() => setEditingMember(m)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          <Edit2 size={12} /> Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>No members found</div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {canEditOrbat && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddElement(true)} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <Plus size={15} /> Add Element
              </button>
            </div>
          )}
          {orbatElements.map(element => (
            <div key={element.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.05em" }}>{element.name.toUpperCase()}</span>
                {canEditOrbat && (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => { setShowAddPosition(element); setNewPositionName(""); }} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}>+ Add Position</button>
                    <button onClick={() => { setShowEditElement(element); setEditElementName(element.name); }} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", color: "var(--text-secondary)" }}><Edit2 size={12} /></button>
                    <button onClick={() => deleteElement(element)} style={{ background: "#ef444415", border: "1px solid #ef4444", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", color: "#ef4444" }}><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1px", background: "var(--border)" }}>
                {(element.positions || []).map(pos => {
                  const m = members.find(mb => mb.element === element.name && mb.position === pos);
                  return (
                    <div key={pos} style={{ background: "var(--bg-card)", padding: "12px 16px", position: "relative" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "4px", textTransform: "uppercase" }}>{pos}</div>
                      {m ? (
                        <Link to={createPageUrl("MemberProfile") + `?id=${m.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "2px" }}>{formatMemberName(m)}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColors[m.status] || "#94a3b8" }} />
                            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{m.status}</span>
                          </div>
                        </Link>
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-secondary)", opacity: 0.4, fontStyle: "italic" }}>TBD</div>
                      )}
                      {canEditOrbat && (
                        <button onClick={() => deletePosition(element, pos)} style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", cursor: "pointer", color: "#ef4444", opacity: 0.5, padding: "2px" }} title="Remove position">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
                {(element.positions || []).length === 0 && (
                  <div style={{ background: "var(--bg-card)", padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic" }}>No positions yet</div>
                )}
              </div>
            </div>
          ))}
          {orbatElements.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>No elements yet — click Add Element to get started</div>
          )}
        </div>
      )}

      {/* Add Element Modal */}
      {showAddElement && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", maxWidth: "420px", width: "100%" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Add New Element</div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Element Name</label>
            <input value={newElementName} onChange={e => setNewElementName(e.target.value)} placeholder="e.g. Recon Element 'Viper 6'" autoFocus
              style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem", marginBottom: "1.25rem" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={addElement} disabled={savingOrbat || !newElementName.trim()} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontWeight: 600, flex: 1, opacity: !newElementName.trim() ? 0.5 : 1 }}>
                {savingOrbat ? "Saving..." : "Add Element"}
              </button>
              <button onClick={() => setShowAddElement(false)} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Element Modal */}
      {showEditElement && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", maxWidth: "420px", width: "100%" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Rename Element</div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Element Name</label>
            <input value={editElementName} onChange={e => setEditElementName(e.target.value)} autoFocus
              style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem", marginBottom: "1.25rem" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={saveEditElement} disabled={savingOrbat || !editElementName.trim()} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontWeight: 600, flex: 1, opacity: !editElementName.trim() ? 0.5 : 1 }}>
                {savingOrbat ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setShowEditElement(null)} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Position Modal */}
      {showAddPosition && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", maxWidth: "420px", width: "100%" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>Add Position</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>{showAddPosition.name}</div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Position Name</label>
            <input value={newPositionName} onChange={e => setNewPositionName(e.target.value)} placeholder="e.g. Sniper" autoFocus
              style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem", marginBottom: "1.25rem" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={addPosition} disabled={savingOrbat || !newPositionName.trim()} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontWeight: 600, flex: 1, opacity: !newPositionName.trim() ? 0.5 : 1 }}>
                {savingOrbat ? "Saving..." : "Add Position"}
              </button>
              <button onClick={() => setShowAddPosition(null)} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* LOA Modal */}
      {loaMember && (
        <LOAModal member={loaMember} onClose={() => setLoaMember(null)} onSaved={() => { setLoaMember(null); load(); }} />
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} onSaved={() => { setEditingMember(null); load(); }} onDeleted={() => { setEditingMember(null); load(); }} />
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal onClose={() => setShowAddMember(false)} onSaved={() => { setShowAddMember(false); load(); }} />
      )}

      {/* Status Change Confirmation */}
      {confirmStatus && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", maxWidth: "400px", width: "100%", textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "8px" }}>Confirm Status Change</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Set <strong style={{ color: "var(--text-primary)" }}>{confirmStatus.member.unit_name}</strong> to <strong style={{ color: statusColors[confirmStatus.newStatus] }}>{confirmStatus.newStatus}</strong>?
              {confirmStatus.member.status === "Discharged" && confirmStatus.newStatus === "Active" && (
                <span style={{ display: "block", marginTop: "6px", fontSize: "0.8rem", color: "#f59e0b" }}>This will reset their join date to today.</span>
              )}
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button onClick={() => setConfirmStatus(null)} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
              <button onClick={applyStatusChange} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}