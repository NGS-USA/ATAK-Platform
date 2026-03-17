import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

const ELEMENT_ORDER = [
  "Lead Element 'Viper 1'",
  "Tactical Element 'Viper 2'",
  "Tactical Element 'Viper 3'",
  "Support Element 'Viper 4'",
  "Support Element 'Viper 5'",
];

const RSVP_OPTIONS = [
  { status: "Attending", color: "#4ade80", icon: CheckCircle },
  { status: "Absent", color: "#ef4444", icon: XCircle },
  { status: "Late", color: "#3b82f6", icon: Clock },
];

export default function EventRSVPPanel({ event, currentMember }) {
  const [rsvps, setRsvps] = useState([]);
  const [members, setMembers] = useState([]);
  const [myRsvp, setMyRsvp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    loadData();
  }, [event.id]);

  const loadData = async () => {
    const [rsvpData, memberData] = await Promise.all([
      db.filter('EventRSVP', { event_id: event.id }),
      db.list('Member', '-created_date', 500)
    ]);
    setRsvps(rsvpData);
    setMembers(memberData);
    if (currentMember) {
      setMyRsvp(rsvpData.find(r => r.member_id === currentMember.id) || null);
    }
  };

  const submitRsvp = async (status) => {
    if (!currentMember) return;
    setLoading(true);
    if (myRsvp) {
      await db.update('EventRSVP', myRsvp.id, { status });
    } else {
      await db.create('EventRSVP', {
        event_id: event.id,
        member_id: currentMember.id,
        member_name: currentMember.unit_name,
        status,
      });
    }
    await loadData();
    setLoading(false);
    setShowPopup(false);
  };

  const attending = rsvps.filter(r => r.status === "Attending" || r.status === "Late");

  const enriched = attending.map(r => {
    const member = members.find(m => m.id === r.member_id);
    return { ...r, element: member?.element || "Unassigned" };
  }).sort((a, b) => {
    const ai = ELEMENT_ORDER.indexOf(a.element);
    const bi = ELEMENT_ORDER.indexOf(b.element);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const grouped = ELEMENT_ORDER.reduce((acc, el) => {
    const group = enriched.filter(r => r.element === el);
    if (group.length) acc[el] = group;
    return acc;
  }, {});
  const unassigned = enriched.filter(r => !ELEMENT_ORDER.includes(r.element));

  const myStatus = myRsvp?.status;
  const myOption = RSVP_OPTIONS.find(o => o.status === myStatus);

  return (
    <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={14} style={{ color: "var(--text-secondary)" }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
            ATTENDEES ({attending.length})
          </span>
        </div>

        {currentMember && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowPopup(!showPopup)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "5px 14px", borderRadius: "6px", cursor: "pointer",
                fontSize: "0.75rem", fontWeight: 600,
                background: myOption ? `${myOption.color}25` : "var(--bg-secondary)",
                border: `1px solid ${myOption ? myOption.color : "var(--border)"}`,
                color: myOption ? myOption.color : "var(--text-secondary)",
              }}
            >
              {myOption ? <myOption.icon size={12} /> : null}
              {myStatus || "Set RSVP"}
            </button>

            {showPopup && (
              <>
                <div onClick={() => setShowPopup(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "10px", zIndex: 99, minWidth: "160px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden"
                }}>
                  {RSVP_OPTIONS.map(({ status, color, icon: Icon }) => (
                    <button
                      key={status}
                      onClick={() => submitRsvp(status)}
                      disabled={loading}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        width: "100%", padding: "10px 14px", background: myStatus === status ? `${color}15` : "transparent",
                        border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                        color: myStatus === status ? color : "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600
                      }}
                    >
                      <Icon size={14} style={{ color }} /> {status}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!currentMember && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Register to RSVP</span>
        )}
      </div>

      {attending.length === 0 && (
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>No attendees yet</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Object.entries(grouped).map(([element, members]) => (
          <div key={element}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.06em", marginBottom: "4px" }}>
              {element.toUpperCase()}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {members.map(r => {
                const opt = RSVP_OPTIONS.find(o => o.status === r.status);
                return (
                  <span key={r.id} style={{
                    fontSize: "0.75rem", padding: "2px 10px", borderRadius: "20px",
                    background: opt ? `${opt.color}20` : "var(--bg-secondary)",
                    color: opt ? opt.color : "var(--text-secondary)",
                    border: `1px solid ${opt ? `${opt.color}40` : "var(--border)"}`,
                    fontWeight: 600
                  }}>
                    {r.member_name} {r.status === "Late" ? "(Late)" : ""}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
        {unassigned.length > 0 && (
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.06em", marginBottom: "4px" }}>UNASSIGNED</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {unassigned.map(r => (
                <span key={r.id} style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: "20px", background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  {r.member_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
