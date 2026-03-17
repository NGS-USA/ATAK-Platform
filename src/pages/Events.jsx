import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { Calendar, Clock, MapPin, Plus, Edit2, Trash2, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import EventRSVPPanel from "../components/events/EventRSVPPanel";
import AARModal from "../components/events/AARModal";
import { logAction } from "../components/auditLog";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import ReactMarkdown from "react-markdown";
import { useUser } from "@clerk/clerk-react";

const typeColors = { Operation: "#3b82f6", Training: "#f59e0b", Meeting: "#8b5cf6", Other: "#64748b" };
const statusColors = { Upcoming: "#4ade80", Active: "#f59e0b", Completed: "#94a3b8", Cancelled: "#ef4444" };

export default function Events() {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMember, setCurrentMember] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [aarEvent, setAarEvent] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [form, setForm] = useState({ title: "", type: "Operation", description: "", date: "", timezone: "America/New_York", map: "", campaign_id: "", campaign_name: "" });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [evts, c, perms] = await Promise.all([
      db.list('Event', 'date', 100),
      db.list('Campaign'),
      db.filter('PermissionConfig', { section: 'AAR' }),
    ]);
    setEvents(evts);
    setCampaigns(c);
    setPermissions(perms[0] || null);
    setLoading(false);
  };


  const canSubmitAAR = () => {
    if (!user || !currentMember) return false;
    if (user.publicMetadata?.role === "admin") return true;
    if (!permissions?.allowed_roles || permissions.allowed_roles.length === 0) return false;
    const userRoles = currentMember.discord_roles || [];
    return userRoles.some(role => permissions.allowed_roles.includes(role));
  };

  const canEdit = user?.role === "admin";

  const save = async () => {
    if (editing) {
      await db.update('Event', editing.id, form);
      logAction({ action: "UPDATE_EVENT", target: form.title, details: `Type: ${form.type} | Status: ${form.status} | Date: ${form.date} | Map: ${form.map || "N/A"}${form.campaign_name ? ` | Campaign: ${form.campaign_name}` : ""}`, section: "Events" });
    } else {
      await db.create('Event', form);
      logAction({ action: "CREATE_EVENT", target: form.title, details: `Type: ${form.type} | Date: ${form.date} | Map: ${form.map || "N/A"}${form.campaign_name ? ` | Campaign: ${form.campaign_name}` : ""}`, section: "Events" });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ title: "", type: "Operation", description: "", date: "", timezone: "EST", map: "", status: "Upcoming" });
    load();
  };

  const del = async (id) => {
    if (!confirm("Delete this event?")) return;
    const ev = events.find(e => e.id === id);
    await db.delete('Event', id);
    logAction({ action: "DELETE_EVENT", target: ev?.title || id, details: `Type: ${ev?.type} | Date: ${ev?.date} | Status: ${ev?.status}`, section: "Events" });
    load();
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setForm({ title: ev.title, type: ev.type, description: ev.description || "", date: ev.date?.slice(0, 16), timezone: ev.timezone || "America/New_York", map: ev.map || "", campaign_id: ev.campaign_id || "", campaign_name: ev.campaign_name || "" });
    setShowForm(true);
  };

  const upcoming = events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = events.filter(e => new Date(e.date) < new Date()).sort((a, b) => new Date(b.date) - new Date(a.date));

  const EventCard = ({ ev }) => {
    const isExpanded = expandedId === ev.id;
    const isPast = new Date(ev.date) < new Date();
    const shouldShowRSVP = !isPast || isExpanded;
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1, cursor: isPast ? "pointer" : "default" }} onClick={() => isPast && setExpandedId(isExpanded ? null : ev.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontWeight: 700, fontSize: "1rem" }}>{ev.title}</span>
              <span style={{ background: typeColors[ev.type], color: "#fff", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>{ev.type}</span>
              <span style={{ background: `${statusColors[ev.status]}20`, color: statusColors[ev.status], fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>{ev.status}</span>
            </div>
            {ev.description && <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "8px", wordBreak: "break-word", overflowWrap: "break-word", maxWidth: "100%", overflow: "hidden" }} className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: ev.description }} />}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                <Calendar size={13} /> {format(new Date(ev.date), "MMM dd, yyyy")}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                <Clock size={13} /> {format(new Date(ev.date), "HH:mm")} {ev.timezone}
              </span>
              {ev.map && <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)", fontSize: "0.8rem" }}><MapPin size={13} /> {ev.map}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", marginLeft: "12px", alignItems: "center" }}>
            {isPast && canSubmitAAR() && (
              <button onClick={() => setAarEvent(ev)} style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(74,222,128,0.1)", border: "1px solid var(--accent)", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", color: "var(--accent)", fontSize: "0.75rem", fontWeight: 600 }}>
                <FileText size={13} /> Submit AAR
              </button>
            )}
            {canEdit && (
              <>
                <button onClick={() => openEdit(ev)} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "var(--text-secondary)" }}><Edit2 size={13} /></button>
                <button onClick={() => del(ev.id)} style={{ background: "#ef444420", border: "1px solid #ef4444", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#ef4444" }}><Trash2 size={13} /></button>
              </>
            )}
          </div>
        </div>
        {shouldShowRSVP && <EventRSVPPanel event={ev} currentMember={currentMember} />}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Calendar size={20} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Events</h1>
        </div>
        {canEdit && (
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", type: "Operation", description: "", date: "", timezone: "America/New_York", map: "", campaign_id: "", campaign_name: "" }); }} style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
            <Plus size={16} /> Add Event
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", fontWeight: 700 }}>{editing ? "Edit Event" : "New Event"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Title", key: "title", type: "text" },
              { label: "Map", key: "map", type: "text" },
              { label: "Date & Time", key: "date", type: "datetime-local" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, campaign_id: "", campaign_name: "" })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
                {["Operation", "Training", "Meeting", "Other"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {form.type === "Operation" && (
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Link to Campaign</label>
                <select value={form.campaign_id} onChange={e => {
                  const c = campaigns.find(c => c.id === e.target.value);
                  setForm({ ...form, campaign_id: e.target.value, campaign_name: c?.name || "" });
                }} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
                  <option value="">None</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Description</label>
              <ReactQuill value={form.description} onChange={val => setForm({ ...form, description: val })} theme="snow" style={{ borderRadius: "6px", height: "200px" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "13rem" }}>
            <button onClick={save} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading events...</div> : (
        <>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: "1rem" }}>UPCOMING</h2>
          {upcoming.length === 0 && <div style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>No upcoming events</div>}
          {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}

          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: "1rem", marginTop: "1.5rem" }}>PAST EVENTS</h2>
          {past.length === 0 && <div style={{ color: "var(--text-secondary)" }}>No past events</div>}
          {past.slice(0, 10).map(ev => <EventCard key={ev.id} ev={ev} />)}
        </>
      )}

      {aarEvent && user && (
        <AARModal
          event={aarEvent}
          currentUser={user}
          onClose={() => setAarEvent(null)}
          onSubmitted={() => { setAarEvent(null); load(); }}
        />
      )}
    </div>
  );
}
}