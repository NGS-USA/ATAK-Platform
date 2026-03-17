import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/api/apiClient";
import { Shield, AlertTriangle, Plus, Save, Activity } from "lucide-react";
import { logAction } from "../components/auditLog";
import { format } from "date-fns";
import { ELEMENTS, POSITIONS_BY_ELEMENT } from "../components/constants/elements";
import { QUALIFICATIONS } from "../components/constants/qualifications";

const SECTIONS = ["dashboard", "events", "campaigns", "roster", "training", "recruitment", "disciplinary", "admin"];

function RoleMultiSelect({ value = [], options, onChange }) {
  const [open, setOpen] = useState(false);
  const toggle = (name) => {
    if (value.includes(name)) onChange(value.filter(v => v !== name));
    else onChange([...value, name]);
  };
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px", cursor: "pointer", fontSize: "0.85rem", minHeight: "34px", display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
        {value.length === 0 && <span style={{ color: "var(--text-secondary)" }}>Select roles...</span>}
        {value.map(r => (
          <span key={r} style={{ background: "var(--accent)20", color: "var(--accent)", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>{r}</span>
        ))}
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 99, maxHeight: "200px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            {options.length === 0 && <div style={{ padding: "10px 12px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>No roles found</div>}
            {options.map(r => (
              <div key={r.name} onClick={() => toggle(r.name)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", cursor: "pointer", background: value.includes(r.name) ? "var(--accent)10" : "transparent", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: "14px", height: "14px", border: `2px solid ${value.includes(r.name) ? "var(--accent)" : "var(--border)"}`, borderRadius: "3px", background: value.includes(r.name) ? "var(--accent)" : "transparent", flexShrink: 0 }} />
                <span style={{ fontSize: "0.85rem" }}>{r.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Admin() {
  const { user } = useUser();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("da");
  const [members, setMembers] = useState([]);
  const [das, setDas] = useState([]);
  const [perms, setPerms] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daForm, setDaForm] = useState({ subject_member_name: "", description: "", severity: 1, punishment: "Warning", incident_date: "", is_qual_strip: false, qualification_to_strip: "" });

  const getPunishmentForSeverity = (sev) => {
    const mapping = { 1: "Warning", 2: "Demotion", 3: "24-hour Ban", 4: "Permanent Ban" };
    return mapping[sev] || "Warning";
  };
  const [showDaForm, setShowDaForm] = useState(false);
  const [themeForm, setThemeForm] = useState({});
  const [themeSaved, setThemeSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [discordRoles, setDiscordRoles] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
// Call your Netlify function for Discord roles
fetch('/.netlify/functions/getDiscordRoles')
  .then(r => r.json())
  .then(res => { if (res.roles) setDiscordRoles(res.roles); })
  .catch(() => {});
const [m, d, p, t, al] = await Promise.all([
  db.list('Member', '-created_date', 200),
  db.list('DisciplinaryAction', '-created_date', 100),
  db.list('PermissionConfig'),
  db.filter('ThemeConfig', { config_key: 'global' }),
  db.list('AuditLog', '-created_date', 200),
]);
    setMembers(m);
    setDas(d);
    setPerms(p);
    setAuditLogs(al);
    const tConfig = t[0] || { config_key: "global", bg_primary: "#0a0c0f", bg_secondary: "#111318", bg_card: "#161a21", accent_primary: "#4ade80", accent_secondary: "#22c55e", accent_danger: "#ef4444", accent_warning: "#f59e0b", text_primary: "#f1f5f9", text_secondary: "#94a3b8", border_color: "#1e2530", unit_name: "Task Force HQ", unit_tagline: "Arma Reforger Milsim Unit" };
    setTheme(tConfig);
    setThemeForm(tConfig);
    setLoading(false);
  };

  const handleLogoUpload = async (e) => {
  // File upload requires Cloudinary setup — see Phase 4 notes
  alert("Logo upload not yet configured. Set up Cloudinary first.");
};

  const saveTheme = async () => {
    if (theme.id) {
      await db.update('ThemeConfig', theme.id, themeForm);
    } else {
      await db.create('ThemeConfig', themeForm);
    }
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
    load();
  };

  const submitDA = async () => {
    await db.create('DisciplinaryAction', { ...daForm, issued_by_name: user?.full_name, issued_by_id: user?.id });
    let logDetails = `Punishment: ${daForm.punishment} | Severity Level: ${daForm.severity} | Incident Date: ${daForm.incident_date || "N/A"} | Description: ${daForm.description}`;
    
    if (daForm.is_qual_strip && daForm.qualification_to_strip) {
      const selectedMember = members.find(m => m.unit_name === daForm.subject_member_name);
      await db.create('QualificationRemoval', {
      member_id: selectedMember?.id,
      member_name: daForm.subject_member_name,
      qualification: daForm.qualification_to_strip,
      removed_by_name: user?.fullName,
      removed_by_id: user?.id,
      reason: daForm.description,
    });
      logDetails += ` | Qual Strip: ${daForm.qualification_to_strip}`;
    }
    
    logAction({ action: "FILE_DA", target: daForm.subject_member_name, details: logDetails, section: "Admin" });
    setShowDaForm(false);
    setDaForm({ subject_member_name: "", description: "", severity: 1, punishment: "Warning", incident_date: "", is_qual_strip: false, qualification_to_strip: "" });
    load();
  };

  const savePermission = async (section, field, value) => {
    const existing = perms.find(p => p.section === section);
    const roles = Array.isArray(value) ? value : value.split(",").map(v => v.trim()).filter(Boolean);
    if (existing) {
      await db.update('PermissionConfig', existing.id, { [field]: roles });
    } else {
      await db.create('PermissionConfig', { section, [field]: roles });
    }
    load();
  };


  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading...</div>;
  if (!user || !isAdmin) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <Shield size={40} style={{ color: "var(--text-secondary)", marginBottom: "1rem" }} />
      <h2 style={{ fontWeight: 700 }}>Access Denied</h2>
      <p style={{ color: "var(--text-secondary)" }}>You must be an admin to access this panel.</p>
    </div>
  );

  const tabs = [
    { id: "da", label: "Disciplinary Actions" },
    { id: "permissions", label: "Permissions" },
    { id: "audit", label: "Audit Log" },
  ];

  const severityColors = { 1: "#f59e0b", 2: "#f97316", 3: "#ef4444" };
  const punishmentColors = { Warning: "#f59e0b", Demotion: "#f97316", Ban: "#ef4444" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
        <Shield size={20} style={{ color: "var(--accent)" }} />
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Admin Panel</h1>
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent", color: tab === t.id ? "var(--accent)" : "var(--text-secondary)", padding: "8px 16px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Disciplinary Actions Tab */}
      {tab === "da" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>Disciplinary Actions</h2>
            <button onClick={() => setShowDaForm(!showDaForm)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
              <Plus size={15} /> File DA
            </button>
          </div>

          {showDaForm && (
            <div style={{ background: "var(--bg-card)", border: "1px solid #ef4444", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                <AlertTriangle size={18} style={{ color: "#ef4444" }} />
                <h3 style={{ fontWeight: 700 }}>File Disciplinary Action</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Member Receiving DA *</label>
                  <select value={daForm.subject_member_name} onChange={e => setDaForm({ ...daForm, subject_member_name: e.target.value })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
                    <option value="">Select member...</option>
                    {members.filter(m => m.status === "Active").map(m => <option key={m.id} value={m.unit_name}>{m.unit_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Incident Date</label>
                  <input type="datetime-local" value={daForm.incident_date} onChange={e => setDaForm({ ...daForm, incident_date: e.target.value })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Severity Level *</label>
                  <select value={daForm.severity} onChange={e => {
                    const newSeverity = Number(e.target.value);
                    setDaForm({ ...daForm, severity: newSeverity, punishment: getPunishmentForSeverity(newSeverity) });
                  }} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
                    <option value={1}>Level 1 — Minor</option>
                    <option value={2}>Level 2 — Moderate</option>
                    <option value={3}>Level 3 — Severe</option>
                    <option value={4}>Level 4 — Critical</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Punishment * (auto-selected)</label>
                  <input type="text" value={daForm.punishment} readOnly style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem", cursor: "not-allowed", opacity: 0.7 }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Description / What Happened *</label>
                  <textarea value={daForm.description} onChange={e => setDaForm({ ...daForm, description: e.target.value })} rows={4} placeholder="Describe the incident in detail..." style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem", resize: "vertical" }} />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "6px", cursor: "pointer" }}>
                  <input type="checkbox" checked={daForm.is_qual_strip} onChange={e => setDaForm({ ...daForm, is_qual_strip: e.target.checked, qualification_to_strip: "" })} style={{ cursor: "pointer" }} />
                  <label style={{ fontSize: "0.85rem", color: "var(--text-primary)", cursor: "pointer" }}>This is a Qualification Strip (Qual Strip)</label>
                </div>
                {daForm.is_qual_strip && (
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Select Qualification to Strip *</label>
                    <select value={daForm.qualification_to_strip} onChange={e => setDaForm({ ...daForm, qualification_to_strip: e.target.value })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
                      <option value="">Select qualification...</option>
                      {Object.values(QUALIFICATIONS).flat().map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
                <button onClick={submitDA} disabled={!daForm.subject_member_name || !daForm.description || (daForm.is_qual_strip && !daForm.qualification_to_strip)} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontWeight: 700, opacity: (!daForm.subject_member_name || !daForm.description || (daForm.is_qual_strip && !daForm.qualification_to_strip)) ? 0.5 : 1 }}>Submit DA</button>
                <button onClick={() => setShowDaForm(false)} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {das.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>No disciplinary actions on record</div>}
          {das.map(da => (
            <div key={da.id} style={{ background: "var(--bg-card)", border: `1px solid ${severityColors[da.severity]}40`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 700 }}>{da.subject_member_name}</span>
                  <span style={{ background: `${severityColors[da.severity]}20`, color: severityColors[da.severity], fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>Severity {da.severity}</span>
                  <span style={{ background: `${punishmentColors[da.punishment]}20`, color: punishmentColors[da.punishment], fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>{da.punishment}</span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{da.incident_date ? format(new Date(da.incident_date), "MMM d, yyyy") : format(new Date(da.created_date), "MMM d, yyyy")}</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "4px" }}>{da.description}</p>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Filed by: {da.issued_by_name || "Unknown"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Permissions Tab */}
      {tab === "audit" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <Activity size={16} style={{ color: "var(--accent)" }} />
            <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>Audit Log</h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>({auditLogs.length} entries)</span>
          </div>
          {auditLogs.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>No audit entries yet</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {auditLogs.map(log => (
              <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent)" }}>{log.actor_name}</span>
                    <span style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", fontSize: "0.7rem", padding: "1px 8px", borderRadius: "4px", fontWeight: 600, letterSpacing: "0.04em" }}>{log.action}</span>
                    {log.target && <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>→ {log.target}</span>}
                    {log.section && <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", background: "var(--bg-secondary)", padding: "1px 6px", borderRadius: "4px" }}>{log.section}</span>}
                  </div>
                  {log.details && <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "3px" }}>{log.details}</div>}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {new Date(log.created_date).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "permissions" && (
        <div>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>Role-Based Permissions</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "1.25rem" }}>Select Discord roles that can view or edit each section.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {SECTIONS.map(section => {
              const perm = perms.find(p => p.section === section) || {};
              return (
                <div key={section} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem", textTransform: "capitalize" }}>{section}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Can View</label>
                      <RoleMultiSelect
                        value={perm.viewer_roles || []}
                        options={discordRoles}
                        onChange={val => savePermission(section, "viewer_roles", val)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Can Edit</label>
                      <RoleMultiSelect
                        value={perm.allowed_roles || []}
                        options={discordRoles}
                        onChange={val => savePermission(section, "allowed_roles", val)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
}