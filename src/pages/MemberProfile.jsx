import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { format, differenceInDays, differenceInMonths, startOfYear, eachDayOfInterval, endOfYear } from "date-fns";
import { User, Calendar, TrendingUp, Award, Star, Plus, X } from "lucide-react";
import { QUALIFICATIONS } from "../components/constants/qualifications";

const statusColors = { Active: "#4ade80", Inactive: "#94a3b8", LOA: "#f59e0b", Discharged: "#ef4444" };

export default function MemberProfile() {
  const [member, setMember] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentMember, setCurrentMember] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [awards, setAwards] = useState([]);
  const [qualStrips, setQualStrips] = useState([]);
  const [manualQuals, setManualQuals] = useState([]);
  const [editingQuals, setEditingQuals] = useState(new Set());
  const [rosterPerms, setRosterPerms] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("id");
  const isMe = params.get("me") === "true";

  useEffect(() => {
    loadData();
  }, [memberId]);

  const loadData = async () => {
    try {
      setCurrentUser(user);

      let m;
      if (isMe) {
  const members = await db.filter('Member', { user_id: user.id });
  m = members[0];
} else if (memberId) {
  const all = await db.filter('Member', { id: memberId });
  m = all[0];
}

      if (m) {
       setMember(m);
       const [att, training, promos, awards, strips, manual, perms] = await Promise.all([
  db.filter('Attendance', { member_id: m.id }),
  db.list('TrainingRecord', '-training_date', 500),
  db.filter('Promotion', { member_id: m.id }),
  db.filter('Award', { member_id: m.id }),
  db.filter('QualificationRemoval', { member_id: m.id }),
  db.filter('ManualQualification', { member_id: m.id }),
  db.filter('PermissionConfig', { section: 'Roster' }),
]);
       setAttendances(att);
       setTrainingRecords(training);
       setPromotions(promos);
       setAwards(awards);
       setQualStrips(strips);
       setManualQuals(manual);
       setCurrentMember(m);
       setRosterPerms(perms[0] || null);
      }
    } catch {}
    setLoading(false);
  };

  // Build attendance grid for the current year
  const buildAttendanceGrid = () => {
    const year = new Date().getFullYear();
    const days = eachDayOfInterval({ start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 11, 31)) });
    const attendedDates = new Set(attendances.map(a => format(new Date(a.event_date), "yyyy-MM-dd")));
    return days.map(day => ({
      date: format(day, "yyyy-MM-dd"),
      attended: attendedDates.has(format(day, "yyyy-MM-dd")),
    }));
  };

  // Get member's qualifications from training records, excluding stripped ones
  const getMemberQuals = () => {
    if (!member) return new Set();
    const passed = new Set();
    const stripped = new Set(qualStrips.map(qs => qs.qualification));
    trainingRecords.forEach(tr => {
      if (tr.passed_members?.includes(member.id) && !stripped.has(tr.qualification)) {
        passed.add(tr.qualification);
      }
    });
    return passed;
  };

  // editingQuals tracks manual quals being toggled
  // editingStrips tracks training-earned quals being stripped
  const [editingStrips, setEditingStrips] = useState(new Set());

  const toggleManualQual = (qual) => {
    const newEditing = new Set(editingQuals);
    if (newEditing.has(qual)) newEditing.delete(qual);
    else newEditing.add(qual);
    setEditingQuals(newEditing);
  };

  const toggleStripQual = (qual) => {
    const newStrips = new Set(editingStrips);
    if (newStrips.has(qual)) newStrips.delete(qual);
    else newStrips.add(qual);
    setEditingStrips(newStrips);
  };

  const saveQualifications = async () => {
    // Handle manual quals
    const currentManualSet = new Set(manualQuals.map(mq => mq.qualification));
    for (const qual of editingQuals) {
      if (!currentManualSet.has(qual)) {
        await db.create('ManualQualification', {
          member_id: member.id,
          member_name: member.unit_name,
          qualification: qual,
          added_by_id: currentUser?.id,
          added_by_name: currentUser?.full_name,
        });
      }
    }
    for (const qual of currentManualSet) {
      if (!editingQuals.has(qual)) {
        const toDelete = manualQuals.find(mq => mq.qualification === qual);
        if (toDelete) await db.delete('ManualQualification', toDelete.id).catch(() => {});
      }
    }

    // Handle training qual strips
    const currentStripsSet = new Set(qualStrips.map(qs => qs.qualification));
    for (const qual of editingStrips) {
      if (!currentStripsSet.has(qual)) {
        await db.create('QualificationRemoval', {
          member_id: member.id,
          member_name: member.unit_name,
          qualification: qual,
          removed_by_id: currentUser?.id,
          removed_by_name: currentUser?.full_name,
        });
      }
    }
    for (const qual of currentStripsSet) {
      if (!editingStrips.has(qual)) {
        const toDelete = qualStrips.find(qs => qs.qualification === qual);
        if (toDelete) await db.delete('QualificationRemoval', toDelete.id).catch(() => {});
      }
    }

    setEditingQuals(new Set());
    setEditingStrips(new Set());
    loadData();
  };

  const cancelQualifications = () => {
    setEditingQuals(new Set());
    setEditingStrips(new Set());
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading profile...</div>;
  if (!member) return <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Member not found</div>;

  const grid = buildAttendanceGrid();
  const quals = getMemberQuals();
  const joinDate = member.join_date ? new Date(member.join_date) : null;
  const timeInService = joinDate ? differenceInMonths(new Date(), joinDate) : 0;
  const canEdit = currentUser && (member.user_id === currentUser.id || currentUser.role === "admin");
  
  const canEditQuals = () => {
    if (currentUser?.role === "admin") return true;
    if (!rosterPerms?.allowed_roles) return false;
    const userRoles = currentMember?.discord_roles || [];
    return userRoles.some(role => rosterPerms.allowed_roles.includes(role));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.5rem", alignItems: "start" }}>
      {/* Left Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Avatar + Info */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", overflow: "hidden" }}>
            {member.avatar_url ? <img src={member.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={36} color="#000" />}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "0.1em", marginBottom: "4px" }}>{member.rank} · {member.position || "Member"}</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "8px" }}>{member.unit_name}</div>
          {member.element && <div style={{ display: "inline-block", background: "var(--bg-secondary)", border: "1px solid var(--border)", fontSize: "0.75rem", padding: "2px 10px", borderRadius: "4px", marginBottom: "8px" }}>{member.element}</div>}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `${statusColors[member.status]}20`, color: statusColors[member.status], fontSize: "0.8rem", padding: "4px 12px", borderRadius: "20px", fontWeight: 600 }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColors[member.status] }} />
            {member.status}
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Time in Service", value: `${timeInService} months` },
              { label: "Time in Grade", value: `${member.time_in_grade_days || 0} days` },
              { label: "Enlisted", value: joinDate ? format(joinDate, "MMM d, yyyy") : "N/A" },
              { label: "Attendances", value: attendances.filter(a => a.attended).length },
              { label: "Direct Superior", value: member.direct_superior_name || "N/A" },
              { label: "Discord", value: member.discord_username || "N/A" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, wordBreak: "break-word" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Attendance Graph */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em" }}>// Attendance</span>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{new Date().getFullYear()}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(53, 12px)`, gridTemplateRows: "repeat(7, 12px)", gap: "2px", width: "fit-content" }}>
              {grid.map(({ date, attended }) => (
                <div key={date} title={date} style={{ width: "12px", height: "12px", borderRadius: "2px", background: attended ? "var(--accent)" : "var(--border)" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--border)" }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>No attendance</span>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--accent)", marginLeft: "8px" }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Attended</span>
          </div>
        </div>

        {/* Qualifications */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em" }}>// Qualifications</span>
          </div>
          {Object.entries(QUALIFICATIONS).map(([category, items]) => (
            <div key={category} style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.1em", marginBottom: "8px" }}>{category.toUpperCase()}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "6px" }}>
                {items.map(qual => {
                    const earned = quals.has(qual);
                    const hasManual = manualQuals.some(mq => mq.qualification === qual);
                    const isEditingManual = editingQuals.has(qual);
                    const isStripped = editingStrips.has(qual);
                    // Training-earned: show as earned unless being stripped
                    // Manual: show as earned if in editingQuals or saved
                    const isActive = (earned && !isStripped) || hasManual || isEditingManual;
                    const isClickable = canEditQuals();

                    const handleClick = () => {
                      if (!isClickable) return;
                      if (earned) {
                        // Toggle strip for training-earned quals
                        toggleStripQual(qual);
                      } else {
                        // Toggle manual for non-earned quals
                        toggleManualQual(qual);
                      }
                    };

                    return (
                      <div key={qual} style={{ position: "relative", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, textAlign: "center", border: `1px solid ${isActive ? "var(--accent)" : isStripped ? "#ef4444" : "var(--border)"}`, background: isActive ? "var(--accent)20" : isStripped ? "#ef444415" : "transparent", color: isActive ? "var(--accent)" : isStripped ? "#ef4444" : "var(--text-secondary)", cursor: isClickable ? "pointer" : "default", transition: "all 0.2s" }} onClick={handleClick}>
                        {qual}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
          {canEditQuals() && (editingQuals.size > 0 || editingStrips.size > 0) && (
            <div style={{ display: "flex", gap: "8px", marginTop: "1rem", justifyContent: "flex-end" }}>
              <button onClick={cancelQualifications} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600 }}>Cancel</button>
              <button onClick={saveQualifications} style={{ background: "var(--accent)", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", color: "#000", fontSize: "0.8rem", fontWeight: 600 }}>Save</button>
            </div>
          )}
        </div>

        {/* Promotions */}
        {promotions.length > 0 && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <TrendingUp size={15} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em" }}>// Promotions</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {promotions.sort((a, b) => new Date(b.promotion_date) - new Date(a.promotion_date)).map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{p.old_rank} → <span style={{ color: "var(--accent)" }}>{p.new_rank}</span></div>
                    {p.reason && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>{p.reason}</div>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{format(new Date(p.promotion_date), "MMM d, yyyy")}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Awards */}
        {awards.length > 0 && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <Star size={15} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em" }}>// Awards</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {awards.sort((a, b) => new Date(b.award_date) - new Date(a.award_date)).map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b" }}>{a.award_name}</div>
                    {a.reason && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>{a.reason}</div>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{format(new Date(a.award_date), "MMM d, yyyy")}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}