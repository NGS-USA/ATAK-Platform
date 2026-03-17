import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Search, ChevronRight, Plus, Edit2 } from "lucide-react";
import LOAModal from "../components/roster/LOAModal";
import { logAction } from "../components/auditLog";
import AddMemberModal from "../components/roster/AddMemberModal";
import EditMemberModal from "../components/roster/EditMemberModal";
import { formatMemberName, getRankLabel } from "../components/roster/ranks";

const statusColors = { Active: "#4ade80", Inactive: "#94a3b8", LOA: "#f59e0b", Discharged: "#ef4444" };
const STATUSES = ["Active", "Inactive", "LOA", "Discharged"];

export default function Roster() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Active");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("roster");
  const [user, setUser] = useState(null);
  const [loaMember, setLoaMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null); // { member, newStatus }
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { user } = useUser();  // from Clerk — add this at the top of the component
    const [m] = await Promise.all([
      db.list('Member', '-join_date', 500),
]);

    setMembers(m);
    setUser(u);
    setLoading(false);
  };

  const isAdmin = user?.role === "admin";

  const applyStatusChange = async () => {
    const { member, newStatus } = confirmStatus;
    await db.update('Member', member.id, { status: newStatus });
    logAction({ action: "UPDATE_MEMBER_STATUS", target: member.unit_name, details: `Status changed: ${member.status} → ${newStatus} | Rank: ${member.rank} | Element: ${member.element || "Unassigned"}`, section: "Roster" });
    setConfirmStatus(null);
    load();
  };

  const filtered = members.filter(m => {
    const matchSearch = !search || m.unit_name?.toLowerCase().includes(search.toLowerCase()) || m.rank?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === "all" || m.status === filter;
    return matchSearch && matchStatus;
  });

  const grouped = filtered.reduce((acc, m) => {
    const dep = m.element || "Unassigned";
    if (!acc[dep]) acc[dep] = [];
    acc[dep].push(m);
    return acc;
  }, {});

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
          {isAdmin && (
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
                    {isAdmin ? (
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
                      {isAdmin && (
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
      ) : (() => {
        const POSITIONS_BY_ELEMENT = {
          "Lead Element 'Viper 1'": ["Group Leader", "Group 2IC", "Operations Sergeant", "Assistant Operations Sergeant"],
          "Tactical Element 'Viper 2'": ["Element Leader", "Element 2IC", "Element Member", "Element Combat Medic"],
          "Tactical Element 'Viper 3'": ["Element Leader", "Element 2IC", "Element Member", "Element Combat Medic"],
          "Support Element 'Viper 4'": ["Element Leader", "Element 2IC", "Element Member"],
          "Support Element 'Viper 5'": ["Element Leader", "Element 2IC", "Element Member"],
        };
        const ELEMENTS = Object.keys(POSITIONS_BY_ELEMENT);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {ELEMENTS.map(element => {
              const positions = POSITIONS_BY_ELEMENT[element];
              return (
                <div key={element} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.05em" }}>{element.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1px", background: "var(--border)" }}>
                    {positions.map(pos => {
                      const m = members.find(mb => mb.element === element && mb.position === pos);
                      return m ? (
                        <Link key={pos} to={createPageUrl("MemberProfile") + `?id=${m.id}`} style={{ background: "var(--bg-card)", padding: "12px 16px", textDecoration: "none" }}>
                          <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "4px", textTransform: "uppercase" }}>{pos}</div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "2px" }}>{formatMemberName(m)}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColors[m.status] || "#94a3b8" }} />
                            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{m.status}</span>
                          </div>
                        </Link>
                      ) : (
                        <div key={pos} style={{ background: "var(--bg-card)", padding: "12px 16px" }}>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "4px", textTransform: "uppercase" }}>{pos}</div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-secondary)", opacity: 0.4, fontStyle: "italic" }}>TBD</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* LOA Modal */}
      {loaMember && (
        <LOAModal
          member={loaMember}
          onClose={() => setLoaMember(null)}
          onSaved={() => { setLoaMember(null); load(); }}
        />
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={() => { setEditingMember(null); load(); }}
          onDeleted={() => { setEditingMember(null); load(); }}
        />
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSaved={() => { setShowAddMember(false); load(); }}
        />
      )}

      {/* Status Change Confirmation Dialog */}
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