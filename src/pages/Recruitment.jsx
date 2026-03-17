import { useState, useEffect } from "react";
import { db } from "@/api/apiClient";
import { useUser, useClerk } from "@clerk/clerk-react";
import { UserPlus, Check, X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const statusColors = { Pending: "#f59e0b", Approved: "#4ade80", Denied: "#ef4444" };

export default function Recruitment() {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [reviewForm, setReviewForm] = useState({});
  const [form, setForm] = useState({
    age_confirmed: false,
    has_microphone: false,
    referral_method: "",
    referred_by: "",
    desired_name: "",
    about_yourself: "",
    experience: "",
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    // user now comes from Clerk's useUser() hook
// Add this at the top of the Recruitment component function:
// const { user } = useUser();
// const isAdmin = user?.publicMetadata?.role === 'admin';
if (isAdmin) {
  const apps = await db.list('Application', '-created_date', 100);
  setApplications(apps);
}
    setLoading(false);
  };

  const submit = async () => {
    await db.create('Application', {
  ...form,
  discord_username: user?.fullName || user?.primaryEmailAddress?.emailAddress,
  discord_id: user?.id,
  status: 'Pending',
});
    setSubmitted(true);
    setShowForm(false);
  };

  const review = async (app, status) => {
    const notes = reviewForm[app.id] || "";
    await db.update('Application', app.id, { status, review_notes: notes, reviewed_by: user?.fullName, reviewed_date: new Date().toISOString() });
    load();
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading...</div>;

  // Not logged in
  if (!user) return (
    <div style={{ maxWidth: "500px", margin: "4rem auto", textAlign: "center" }}>
      <UserPlus size={40} style={{ color: "var(--accent)", marginBottom: "1rem" }} />
      <h2 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Join the Unit</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Sign in with Discord to submit a recruitment application.</p>
      <button onClick={() => redirectToSignIn()} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "8px", padding: "12px 28px", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}>Sign in with Discord</button>
    </div>
  );

  const isAdmin = user.role === "admin";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <UserPlus size={20} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Recruitment</h1>
        </div>
        {!isAdmin && !submitted && (
          <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
            <UserPlus size={16} /> Apply to Join
          </button>
        )}
      </div>

      {submitted && (
        <div style={{ background: "#4ade8015", border: "1px solid #4ade80", borderRadius: "12px", padding: "1.5rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <Check size={32} style={{ color: "#4ade80", marginBottom: "8px" }} />
          <h3 style={{ fontWeight: 700, color: "#4ade80" }}>Application Submitted!</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px" }}>Your application has been received. An admin will review it shortly.</p>
          <button onClick={() => { setSubmitted(false); setShowForm(true); }} style={{ marginTop: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
            Submit Another Application
          </button>
        </div>
      )}

      {/* Application Form */}
      {showForm && !isAdmin && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Recruitment Application</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "1.5rem" }}>Ensure all fields are filled out correctly. Your Discord account will be linked to your application.</p>

          {/* Rules panel */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "0.9rem" }}>Before You Apply</div>
            <ul style={{ color: "var(--text-secondary)", fontSize: "0.8rem", paddingLeft: "1.25rem", lineHeight: 1.8, margin: 0 }}>
              <li>Names must be 1 word and 4-digit number (e.g. 0001 Callsign)</li>
              <li>Names must be professional — no profanity or lore names</li>
              <li>You must have a working microphone</li>
              <li>You must be 16+ years of age</li>
              <li>Numbers must be unique (1000-9999)</li>
            </ul>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.875rem" }}>
                <input type="checkbox" checked={form.age_confirmed} onChange={e => setForm({ ...form, age_confirmed: e.target.checked })} />
                I am 16 years of age or older
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.875rem" }}>
                <input type="checkbox" checked={form.has_microphone} onChange={e => setForm({ ...form, has_microphone: e.target.checked })} />
                I have a working microphone
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Desired Name (e.g. 1234 Callsign) *</label>
                <input value={form.desired_name} onChange={e => setForm({ ...form, desired_name: e.target.value })} placeholder="0000 Name" style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>How did you find us?</label>
                <select value={form.referral_method} onChange={e => setForm({ ...form, referral_method: e.target.value })} style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }}>
                  <option value="">Select...</option>
                  {["Discord", "Friend", "Reddit", "YouTube", "Other"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Referred By (if any)</label>
                <input value={form.referred_by} onChange={e => setForm({ ...form, referred_by: e.target.value })} placeholder="Discord username of referrer" style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>About Yourself *</label>
              <textarea value={form.about_yourself} onChange={e => setForm({ ...form, about_yourself: e.target.value })} rows={3} placeholder="Tell us about yourself..." style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem", resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Arma / Milsim Experience</label>
              <textarea value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} rows={2} placeholder="Your gaming and milsim background..." style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "0.875rem", resize: "vertical" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "1.25rem" }}>
            <button onClick={submit} disabled={!form.desired_name || !form.age_confirmed} style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", padding: "10px 24px", cursor: "pointer", fontWeight: 700, opacity: (!form.desired_name || !form.age_confirmed) ? 0.5 : 1 }}>Submit Application</button>
            <button onClick={() => setShowForm(false)} style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px 20px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Admin View */}
      {isAdmin && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
            {["all", "Pending", "Approved", "Denied"].map(s => (
              <button key={s} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600 }} onClick={() => {}}>
                {s === "all" ? "All" : s} {s === "Pending" ? `(${applications.filter(a => a.status === "Pending").length})` : ""}
              </button>
            ))}
          </div>
          {applications.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>No applications yet</div>}
          {applications.map(app => {
            const open = expanded[app.id];
            return (
              <div key={app.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", marginBottom: "1rem", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 700 }}>{app.desired_name}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>— {app.discord_username}</span>
                    <span style={{ background: `${statusColors[app.status]}20`, color: statusColors[app.status], fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>{app.status}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{format(new Date(app.created_date), "MMM d, yyyy")}</span>
                    <button onClick={() => setExpanded({ ...expanded, [app.id]: !open })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {open && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "1.25rem", background: "var(--bg-secondary)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                      {[
                        { label: "Age Confirmed", value: app.age_confirmed ? "Yes" : "No" },
                        { label: "Has Microphone", value: app.has_microphone ? "Yes" : "No" },
                        { label: "Referral", value: app.referral_method || "N/A" },
                        { label: "Referred By", value: app.referred_by || "N/A" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "2px" }}>{label}</div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {app.about_yourself && <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>ABOUT</div><p style={{ fontSize: "0.875rem" }}>{app.about_yourself}</p></div>}
                    {app.experience && <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>EXPERIENCE</div><p style={{ fontSize: "0.875rem" }}>{app.experience}</p></div>}

                    {app.status === "Pending" && (
                      <div style={{ marginTop: "1rem" }}>
                        <textarea value={reviewForm[app.id] || ""} onChange={e => setReviewForm({ ...reviewForm, [app.id]: e.target.value })} placeholder="Review notes / denial reason (required for denial)..." rows={2} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px", color: "var(--text-primary)", fontSize: "0.8rem", resize: "vertical", marginBottom: "10px" }} />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => review(app, "Approved")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#4ade80", color: "#000", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}><Check size={14} /> Approve</button>
                          <button onClick={() => review(app, "Denied")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ef444420", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}><X size={14} /> Deny</button>
                        </div>
                      </div>
                    )}
                    {app.status !== "Pending" && app.review_notes && (
                      <div style={{ marginTop: "8px", padding: "10px", background: "var(--bg-card)", borderRadius: "6px", fontSize: "0.8rem" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Review Notes: </span>{app.review_notes}
                        {app.reviewed_by && <span style={{ color: "var(--text-secondary)" }}> — {app.reviewed_by}</span>}
                      </div>
                    )}
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