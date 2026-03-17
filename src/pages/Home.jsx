import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Target, BookOpen, Clock, Calendar, Server, Flag, ExternalLink, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function Home() {
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [servers, setServers] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [aars, setAars] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Batch 1: Core dashboard data
        const [m, e, c, s] = await Promise.all([
        db.list('Member', '-created_date', 100),
        db.list('Event', 'date', 15),
        db.filter('Campaign', { status: 'Active' }),
        db.list('Server'),
      ]);

      // Batch 2: Operations and attendance data
      const [a, aarList, ops] = await Promise.all([
        db.list('Attendance', '-created_date', 500),
        db.list('AfterActionReport'),
        db.filter('Event', { type: 'Operation' }),
      ]);


        setMembers(m);
        setEvents(e.filter(ev => new Date(ev.date) >= new Date()).slice(0, 4));
        setCampaigns(c);
        setServers(s);
        setAttendances(a);
        setAars(aarList);
        setOperations(ops);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const activeMembers = members.filter(m => m.status === "Active").length;
  const totalDeployments = attendances.filter(a => a.event_type === "Operation" && a.attended).length;
  const totalTrainings = attendances.filter(a => a.event_type === "Training" && a.attended).length;

  const nextEvent = events[0];
  const nextEventCountdown = nextEvent
    ? formatDistanceToNow(new Date(nextEvent.date), { addSuffix: false })
    : "N/A";

  const statCards = [
    { label: "ACTIVE TROOPERS", value: activeMembers, icon: Users },
    { label: "DEPLOYMENTS COMPLETED", value: totalDeployments, icon: Target },
    { label: "TRAININGS RAN", value: totalTrainings, icon: BookOpen },
    { label: "NEXT EVENT", value: nextEventCountdown, subtext: nextEvent?.title, icon: Clock },
  ];

  const typeColors = { Operation: "#3b82f6", Training: "#f59e0b", Meeting: "#8b5cf6", Other: "#64748b" };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading dashboard...</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {statCards.map(({ label, value, subtext, icon: Icon }) => (
          <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Icon size={16} style={{ color: "var(--text-secondary)" }} />
              <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em" }}>{label}</span>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
            {subtext && <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "4px" }}>{subtext}</div>}
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
        {/* Upcoming Events */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} style={{ color: "var(--text-secondary)" }} />
            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Upcoming Events</span>
          </div>
          <div>
            {events.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No upcoming events</div>
            )}
            {events.map((ev) => (
              <div key={ev.id} style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{ev.title}</span>
                  <span style={{ background: typeColors[ev.type] || "#64748b", color: "#fff", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>{ev.type}</span>
                </div>
                {ev.map && <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "4px" }}>{ev.map}</div>}
                <div style={{ display: "flex", gap: "16px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} /> {format(new Date(ev.date), "MMM dd, yyyy")}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} /> {format(new Date(ev.date), "HH:mm")} {ev.timezone || "EST"}
                  </span>
                </div>
                <Link to={createPageUrl("Events") + `?id=${ev.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "10px", padding: "6px", border: "1px solid var(--border)", borderRadius: "6px", textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                  View Details <ChevronRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Server Status */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Server size={16} style={{ color: "var(--text-secondary)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Server Status</span>
            </div>
            <div style={{ padding: "0.5rem 0" }}>
              {servers.length === 0 && (
                <div style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>No servers configured</div>
              )}
              {servers.map(s => (
                <div key={s.id} style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.status === "Online" ? "#4ade80" : s.status === "Restarting" ? "#f59e0b" : "#ef4444" }} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{s.current_players}/{s.max_players}</span>
                  </div>
                  {s.mission && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "3px", paddingLeft: "16px" }}>{s.map} · {s.mission}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Active Campaigns */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Flag size={16} style={{ color: "var(--text-secondary)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Active Campaigns</span>
            </div>
            <div style={{ padding: "0.75rem" }}>
              {campaigns.length === 0 && (
                <div style={{ padding: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>No active campaigns</div>
              )}
              {campaigns.map(c => {
                const totalOps = operations.filter(e => e.campaign_id === c.id).length;
                const completedOps = operations.filter(e => e.campaign_id === c.id && aars.some(a => a.event_id === e.id)).length;
                const pct = totalOps > 0 ? Math.round((completedOps / totalOps) * 100) : 0;
                return (
                  <div key={c.id} style={{ background: "var(--bg-secondary)", borderRadius: "8px", padding: "0.875rem", marginBottom: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.name}</span>
                      <span style={{ background: "#4ade8020", color: "#4ade80", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px" }}>Active</span>
                    </div>
                    {c.description && <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "8px", wordBreak: "break-word", overflowWrap: "break-word", maxWidth: "100%", overflow: "hidden" }} dangerouslySetInnerHTML={{ __html: c.description }} />}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Operations: {completedOps}/{totalOps}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{pct}%</span>
                    </div>
                    <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: "2px", transition: "width 0.3s" }} />
                    </div>
                    <Link to={createPageUrl("Campaigns") + `?id=${c.id}`} style={{ display: "block", textAlign: "center", marginTop: "10px", padding: "5px", background: "var(--border)", borderRadius: "5px", textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      View Campaign
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}