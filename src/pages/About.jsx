import { useState, useEffect } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { Shield, Users, Target, ChevronRight } from "lucide-react";
import { db } from "@/api/apiClient";

export default function About() {
  const { user } = useUser();
  const { redirectToSignIn } = useClerk();
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    db.filter('ThemeConfig', { config_key: 'global' })
      .then(configs => { if (configs.length > 0) setTheme(configs[0]); })
      .catch(() => {});
  }, []);

  const unitName = theme?.unit_name || "Task Force HQ";
  const logoUrl = theme?.unit_logo_url || null;
  const accentColor = theme?.accent_primary || "#4ade80";

  const handleJoinClick = () => {
    if (user) {
      window.location.href = '/Recruitment';
    } else {
      redirectToSignIn();
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1rem" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div style={{ width: "200px", height: "200px", background: logoUrl ? "transparent" : `linear-gradient(135deg, ${accentColor}, #16a34a)`, borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", overflow: "hidden", border: logoUrl ? "1px solid var(--border)" : "none" }}>
          {logoUrl
            ? <img src={logoUrl} alt="Unit Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "12px" }} />
            : <Shield size={100} color="#000" />
          }
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", letterSpacing: "-0.02em" }}>{unitName}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
          {theme?.unit_tagline || "An elite Arma Reforger milsim unit dedicated to tactical excellence, brotherhood, and realistic military simulation."}
        </p>
        <button
          onClick={handleJoinClick}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "10px", padding: "14px 32px", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}
        >
          Apply to Join <ChevronRight size={18} />
        </button>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "10px" }}>Sign in with Discord to submit your application</p>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.25rem", marginBottom: "3rem" }}>
        {[
          { icon: Shield, title: "Tactical Operations", desc: "Participate in large-scale, organized military operations with realistic rules of engagement." },
          { icon: Users, title: "Community", desc: "Join a welcoming community of dedicated milsim players with structured ranks and departments." },
          { icon: Target, title: "Training Programs", desc: "Earn qualifications through dedicated training programs led by experienced instructors." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ width: "40px", height: "40px", background: "var(--accent)20", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              <Icon size={20} style={{ color: "var(--accent)" }} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: "8px" }}>{title}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.5rem", marginBottom: "1rem" }}>Ready to Enlist?</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Connect your Discord account to apply and gain access to the unit portal.</p>
        <button
          onClick={handleJoinClick}
          style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "8px", padding: "12px 28px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}
        >
          Sign in with Discord
        </button>
      </div>
    </div>
  );
}